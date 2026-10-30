# Python first-pass selection

Select 39 of the 72 catalog exercises for interview preparation and practical Python work. This is a broad first pass across all five topics. Seven selected exercises are marked Hard because they teach testing, interface contracts, context managers, or retries.

The selection is stored in [python-first-pass.json](python-first-pass.json). The importer preserves all exercise IDs and applies the selection with `deferred` metadata. The website shows the selected exercises. Untouched optional exercises remain in All problems → Archive and are excluded from daily assignments and forecasts. Previously practiced extras and pending morning work stay active. Notes, ratings, time, backups, and review dates are preserved.

The 60% Python time estimates and spaced reviews still apply. The selected first-study estimates total 1332 minutes. This excludes repeat reviews and is a planning estimate.

## Pybites OOP Path — 9 selected

| Exercise                                                                                                                                                                               | Skill                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [01. Write a property](https://cojudge.musel.dev/problems/pb-01-write-a-property)                                                                                                      | Read-only properties.                                |
| [02. Complete a user class: properties and representation dunder methods](https://cojudge.musel.dev/problems/pb-02-complete-a-user-class-properties-and-representation-dunder-methods) | Object representation and derived values.            |
| [03. Subclassing: Vehicles in Motion](https://cojudge.musel.dev/problems/pb-03-subclassing-vehicles-in-motion)                                                                         | Basic inheritance and polymorphism.                  |
| [04. No promo twice, keep state in a class](https://cojudge.musel.dev/problems/pb-04-no-promo-twice-keep-state-in-a-class)                                                             | State changes and a custom exception.                |
| [07. Implement a color class with staticmethod](https://cojudge.musel.dev/problems/pb-07-implement-a-color-class-with-staticmethod)                                                    | Static methods, validation, and representations.     |
| [09. Write your own data class](https://cojudge.musel.dev/problems/pb-09-write-your-own-data-class)                                                                                    | Dataclasses, defaults, initialization, and ordering. |
| [10. Complete a tox ini file parser class](https://cojudge.musel.dev/problems/pb-10-complete-a-tox-ini-file-parser-class)                                                              | Configuration parsing behind a small class.          |
| [12. Alternative constructors](https://cojudge.musel.dev/problems/pb-12-alternative-constructors)                                                                                      | Alternative constructors and input validation.       |
| [15. Abc's and class inheritance](https://cojudge.musel.dev/problems/pb-15-abcs-and-class-inheritance)                                                                                 | Abstract classes and explicit interface contracts.   |

Leave callable instances, built-in subclassing, multiple inheritance, broad operator overloading, and repeated class exercises for later. The full scraping/composition exercise is a later capstone; apply composition in the practical service first. The transaction context-manager exercise is covered in the Decorators course.

## Pybites Pytest Path — 8 selected

| Exercise                                                                                                                           | Skill                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [01. Write tests for fibonacci](https://cojudge.musel.dev/problems/pbt-01-write-tests-for-fibonacci)                               | Basic assertions and test parametrization.             |
| [02. Write tests for list_to_decimal](https://cojudge.musel.dev/problems/pbt-02-write-tests-for-list-to-decimal)                   | Invalid input, types, and boundary cases.              |
| [03. Test print / standard output](https://cojudge.musel.dev/problems/pbt-03-test-print-standard-output)                           | Captured output.                                       |
| [05. Test code that parses json and ip ranges](https://cojudge.musel.dev/problems/pbt-05-test-code-that-parses-json-and-ip-ranges) | Tests for structured input and dataclasses.            |
| [06. Mocking a standard library function](https://cojudge.musel.dev/problems/pbt-06-mocking-a-standard-library-function)           | Mocking a nondeterministic dependency.                 |
| [07. Write tests for an account class](https://cojudge.musel.dev/problems/pbt-07-write-tests-for-an-account-class)                 | Stateful class behavior and transaction validation.    |
| [09. Test a number guessing game](https://cojudge.musel.dev/problems/pbt-09-test-a-number-guessing-game)                           | Mocked input, output capture, and failure cases.       |
| [10. Test a movie db class](https://cojudge.musel.dev/problems/pbt-10-test-a-movie-db-class)                                       | Database fixtures, setup, cleanup, and query behavior. |

Fizzbuzz repeats the initial testing patterns. Zodiac parsing adds another data-testing scenario; the selected database exercise already gives fixture practice.

## Pybites Data Formats Path — 7 selected

| Exercise                                                                                                                         | Skill                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [02. Analyze some basic car data](https://cojudge.musel.dev/problems/pdf-02-analyze-some-basic-car-data)                         | JSON filtering and aggregation.                                |
| [04. Convert dict to namedtuple/json](https://cojudge.musel.dev/problems/pdf-04-convert-dict-to-namedtuplejson)                  | Conversion between dictionaries, named tuples, and JSON.       |
| [05. Parse omdb movie json data](https://cojudge.musel.dev/problems/pdf-05-parse-omdb-movie-json-data)                           | Nested JSON extraction.                                        |
| [09. Use the ipinfo api to lookup ip country](https://cojudge.musel.dev/problems/pdf-09-use-the-ipinfo-api-to-lookup-ip-country) | An API client call, response parsing, and propagated failures. |
| [11. Turn messy csv into json](https://cojudge.musel.dev/problems/pdf-11-turn-messy-csv-into-json)                               | Messy input normalization and CSV-to-JSON conversion.          |
| [12. Analyze some bite stats data](https://cojudge.musel.dev/problems/pdf-12-analyze-some-bite-stats-data)                       | CSV DictReader and record aggregation.                         |
| [14. Analyze nba data with sqlite3](https://cojudge.musel.dev/problems/pdf-14-analyze-nba-data-with-sqlite3)                     | Parameterized SQL, NULL values, ordering, and aggregation.     |

Leave XML, pickle, plotting, and further analysis variants for later. Movie analysis and nested text counts are selected once in Collections.

## Pybites Collections Path — 8 selected

| Exercise                                                                                                                                                             | Skill                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [01. Loop over a dict of namedtuples calculating a total score](https://cojudge.musel.dev/problems/pbc-01-loop-over-a-dict-of-namedtuples-calculating-a-total-score) | Nested records and named-tuple access.                      |
| [02. Keep a queue of last n items](https://cojudge.musel.dev/problems/pbc-02-keep-a-queue-of-last-n-items)                                                           | A bounded deque.                                            |
| [03. Group names by country](https://cojudge.musel.dev/problems/pbc-03-group-names-by-country)                                                                       | Grouping with dictionaries.                                 |
| [05. Pybites die hard](https://cojudge.musel.dev/problems/pbc-05-pybites-die-hard)                                                                                   | Generator-based file processing and filtered counts.        |
| [07. Find the most common word](https://cojudge.musel.dev/problems/pbc-07-find-the-most-common-word)                                                                 | Text normalization and Counter.                             |
| [08. Movie data analysis](https://cojudge.musel.dev/problems/pbc-08-movie-data-analysis)                                                                             | CSV conversion, grouping, filtering, and aggregate results. |
| [09. What south park characters talk most?](https://cojudge.musel.dev/problems/pbc-09-what-south-park-characters-talk-most)                                          | Nested defaultdict and Counter structures.                  |
| [11. Make an index of story characters](https://cojudge.musel.dev/problems/pbc-11-make-an-index-of-story-characters)                                                 | An inverted index with aliases and duplicate handling.      |

The tag-counting task repeats Counter practice. The named-tuple conversion already appears in Data Formats. HTML scraping is optional for the first pass.

## Pybites Decorators and Context Managers Path — 7 selected

| Exercise                                                                                                                                        | Skill                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [01. Create a sandwich decorator](https://cojudge.musel.dev/problems/pbdc-01-create-a-sandwich-decorator)                                       | A basic function wrapper.                                             |
| [02. Write a decorator with argument](https://cojudge.musel.dev/problems/pbdc-02-write-a-decorator-with-argument)                               | Decorator arguments and closures.                                     |
| [03. Write a login_required decorator](https://cojudge.musel.dev/problems/pbdc-03-write-a-login_required-decorator)                             | Authorization checks, argument forwarding, and metadata preservation. |
| [04. Write a numbers validation decorator](https://cojudge.musel.dev/problems/pbdc-04-write-a-numbers-validation-decorator)                     | Validation before a wrapped function runs.                            |
| [07. Write a context manager](https://cojudge.musel.dev/problems/pbdc-07-write-a-context-manager)                                               | Context-manager entry, rollback, cleanup, and exception propagation.  |
| [09. Write a performance monitoring context manager](https://cojudge.musel.dev/problems/pbdc-09-write-a-performance-monitoring-context-manager) | Generator-based context managers, timing, and failed operations.      |
| [12. Write a retry decorator](https://cojudge.musel.dev/problems/pbdc-12-write-a-retry-decorator)                                               | Bounded retries, successful false values, and exception chaining.     |

Leave singledispatch, descriptor-based cached properties, repeated wrapper transformations, output redirection, and exception suppression for later. The selected tasks already check exception propagation and cleanup.
