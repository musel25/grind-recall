#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n $(git status --porcelain) ]]; then
  echo 'Commit and push changes before deploying.' >&2; exit 1
fi
npm ci
npm test
npm run build
release=$(git rev-parse --short=12 HEAD)
archive=$(mktemp --suffix=.tar.gz)
trap 'rm -f "$archive"' EXIT
tar -C dist -czf "$archive" .
scp "$archive" "my-vps:/tmp/grind-recall-$release.tar.gz"
ssh my-vps bash -s -- "$release" <<'REMOTE'
set -euo pipefail
release=$1
base=/var/www/grind-recall
conf=$(readlink -f /etc/nginx/sites-enabled/timer.musel.dev)
backup="$conf.grind-backup-$release"
previous=$(readlink "$base/current" || true)
sudo mkdir -p "$base/releases/$release"
sudo tar -xzf "/tmp/grind-recall-$release.tar.gz" -C "$base/releases/$release"
sudo chmod -R a+rX "$base/releases/$release"
rm "/tmp/grind-recall-$release.tar.gz"
sudo cp "$conf" "$backup"
rollback() {
  sudo cp "$backup" "$conf"
  if [[ -n "$previous" ]]; then
    sudo ln -sfn "$previous" "$base/current.rollback"
    sudo mv -Tf "$base/current.rollback" "$base/current"
  fi
  sudo nginx -t && sudo systemctl reload nginx
}
trap rollback ERR
if ! sudo grep -q '# Grind Recall static application' "$conf"; then
  candidate=$(mktemp)
  sudo awk '
    /listen 443 ssl/ {tls=1}
    tls && /location \/ \{/ && !inserted {
      print "    # Grind Recall static application"
      print "    location = /grind { return 301 /grind/; }"
      print "    location ^~ /grind/ {"
      print "        alias /var/www/grind-recall/current/;"
      print "        index index.html;"
      print "        expires -1;"
      print "    }"
      inserted=1
    }
    {print}
    END {if (!inserted) exit 1}
  ' "$conf" > "$candidate"
  sudo install -m 644 "$candidate" "$conf"
  rm "$candidate"
fi
sudo ln -sfn "$base/releases/$release" "$base/current.next"
sudo mv -Tf "$base/current.next" "$base/current"
sudo nginx -t
sudo systemctl reload nginx
healthy=false
for attempt in {1..10}; do
  if curl --max-time 10 -fsS https://timer.musel.dev/grind/ | grep -q '<title>Grind Recall</title>'; then
    healthy=true
    break
  fi
  sleep 1
done
[[ "$healthy" = true ]]
curl -fsS https://timer.musel.dev/api/health
printf '\nDeployed release %s\n' "$release"
trap - ERR
REMOTE
curl -fsS https://timer.musel.dev/grind/ >/dev/null
printf 'Live: https://timer.musel.dev/grind/\n'
