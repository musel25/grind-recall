import {initialState} from '../src/model';
import {forecast} from '../src/scheduler';
for(const multiplier of [1,.5,.25]){
 const s=initialState('2026-10-04',true);s.settings.reviewMultiplier=multiplier;
 console.log(JSON.stringify({reviewMultiplier:multiplier,...forecast(s,'2026-10-04')},null,2));
}
