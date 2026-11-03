# Python first-pass selection

Select 25 of the 72 catalog exercises for practical production Python. The goal is the smallest useful set. Each kept exercise teaches one skill that the others do not teach. Five selected exercises are marked Hard because they teach testing, interface contracts, context managers, or retries.

On 2026-11-03 the selection changed from 39 to 25 exercises. Exercises that repeat a skill were moved to the Archive. Four practiced OOP bites are **retired**: OOP 05, 06, 07, and 10. A retired exercise leaves the active plan, reviews, and forecasts, even when it has saved progress. Its notes, ratings, history, and backups stay intact. It is visible in All problems → Archive.

The selection is stored in [python-first-pass.json](python-first-pass.json). Its `retired` list holds the retired exercise IDs. The importer preserves all exercise IDs and applies the selection with `deferred` and `retired` metadata. Untouched optional exercises remain in All problems → Archive and are excluded from daily assignments and forecasts. Previously practiced extras and pending morning work stay active, except retired exercises.

The 50% Python time estimates and spaced reviews still apply. The selected first-study estimates total 705 minutes, including finished work. This excludes repeat reviews and is a planning estimate.

## Pybites OOP Path — 7 selected

| Exercise                                                                                                                                                                               | Skill                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [01. Write a property](https://cojudge.musel.dev/problems/pb-01-write-a-property)                                                                                                      | Read-only properties.                                |
| [02. Complete a user class: properties and representation dunder methods](https://cojudge.musel.dev/problems/pb-02-complete-a-user-class-properties-and-representation-dunder-methods) | Object representation and derived values.            |
| [03. Subclassing: Vehicles in Motion](https://cojudge.musel.dev/problems/pb-03-subclassing-vehicles-in-motion)                                                                         | Basic inheritance and polymorphism.                  |
| [04. No promo twice, keep state in a class](https://cojudge.musel.dev/problems/pb-04-no-promo-twice-keep-state-in-a-class)                                                             | State changes and a custom exception.                |
| [09. Write your own data class](https://cojudge.musel.dev/problems/pb-09-write-your-own-data-class)                                                                                    | Dataclasses, defaults, initialization, and ordering. |
| [12. Alternative constructors](https://cojudge.musel.dev/problems/pb-12-alternative-constructors)                                                                                      | Alternative constructors and input validation.       |
| [15. Abc's and class inheritance](https://cojudge.musel.dev/problems/pb-15-abcs-and-class-inheritance)                                                                                 | Abstract classes and explicit interface contracts.   |

Leave callable instances, built-in subclassing, multiple inheritance, broad operator overloading, and repeated class exercises for later. The full scraping/composition exercise is a later capstone; apply composition in the practical service first. The transaction context-manager exercise is covered in the Decorators course.

Retired after practice: 05 callable instances, 06 built-in subclassing, 07 static methods, and 10 the tox parser. They have little production value.

## Pybites Pytest Path — 6 selected

| Exercise                                                                                                                           | Skill                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [01. Write tests for fibonacci](https://cojudge.musel.dev/problems/pbt-01-write-tests-for-fibonacci)                               | Basic assertions and test parametrization.             |
| [03. Test print / standard output](https://cojudge.musel.dev/problems/pbt-03-test-print-standard-output)                           | Captured output.                                       |
| [05. Test code that parses json and ip ranges](https://cojudge.musel.dev/problems/pbt-05-test-code-that-parses-json-and-ip-ranges) | Tests for structured input and dataclasses.            |
| [06. Mocking a standard library function](https://cojudge.musel.dev/problems/pbt-06-mocking-a-standard-library-function)           | Mocking a nondeterministic dependency.                 |
| [07. Write tests for an account class](https://cojudge.musel.dev/problems/pbt-07-write-tests-for-an-account-class)                 | Stateful class behavior and transaction validation.    |
| [10. Test a movie db class](https://cojudge.musel.dev/problems/pbt-10-test-a-movie-db-class)                                       | Database fixtures, setup, cleanup, and query behavior. |

Fizzbuzz repeats the initial testing patterns. Zodiac parsing adds another data-testing scenario; the selected database exercise already gives fixture practice.

Moved to the Archive: 02 repeats the boundary tests of 01. 09 repeats mocking and output capture from 03 and 06.

## Pybites Data Formats Path — 4 selected

| Exercise                                                                                                                         | Skill                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [05. Parse omdb movie json data](https://cojudge.musel.dev/problems/pdf-05-parse-omdb-movie-json-data)                           | Nested JSON extraction.                                        |
| [09. Use the ipinfo api to lookup ip country](https://cojudge.musel.dev/problems/pdf-09-use-the-ipinfo-api-to-lookup-ip-country) | An API client call, response parsing, and propagated failures. |
| [11. Turn messy csv into json](https://cojudge.musel.dev/problems/pdf-11-turn-messy-csv-into-json)                               | Messy input normalization and CSV-to-JSON conversion.          |
| [14. Analyze nba data with sqlite3](https://cojudge.musel.dev/problems/pdf-14-analyze-nba-data-with-sqlite3)                     | Parameterized SQL, NULL values, ordering, and aggregation.     |

Leave XML, pickle, plotting, and further analysis variants for later. Movie analysis and nested text counts are selected once in Collections.

Moved to the Archive: 02, 04, and 12 repeat JSON and CSV parsing from 05 and 11.

## Pybites Collections Path — 4 selected

| Exercise                                                                                                   | Skill                                                       |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [02. Keep a queue of last n items](https://cojudge.musel.dev/problems/pbc-02-keep-a-queue-of-last-n-items) | A bounded deque.                                            |
| [03. Group names by country](https://cojudge.musel.dev/problems/pbc-03-group-names-by-country)             | Grouping with dictionaries.                                 |
| [07. Find the most common word](https://cojudge.musel.dev/problems/pbc-07-find-the-most-common-word)       | Text normalization and Counter.                             |
| [08. Movie data analysis](https://cojudge.musel.dev/problems/pbc-08-movie-data-analysis)                   | CSV conversion, grouping, filtering, and aggregate results. |

The tag-counting task repeats Counter practice. The named-tuple conversion already appears in Data Formats. HTML scraping is optional for the first pass.

Moved to the Archive: 01, 05, 09, and 11 use the same named tuples, `defaultdict`, and `Counter` a second time.

## Pybites Decorators and Context Managers Path — 4 selected

| Exercise                                                                                                            | Skill                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [01. Create a sandwich decorator](https://cojudge.musel.dev/problems/pbdc-01-create-a-sandwich-decorator)           | A basic function wrapper.                                             |
| [03. Write a login_required decorator](https://cojudge.musel.dev/problems/pbdc-03-write-a-login_required-decorator) | Authorization checks, argument forwarding, and metadata preservation. |
| [07. Write a context manager](https://cojudge.musel.dev/problems/pbdc-07-write-a-context-manager)                   | Context-manager entry, rollback, cleanup, and exception propagation.  |
| [12. Write a retry decorator](https://cojudge.musel.dev/problems/pbdc-12-write-a-retry-decorator)                   | Bounded retries, successful false values, and exception chaining.     |

Leave singledispatch, descriptor-based cached properties, repeated wrapper transformations, output redirection, and exception suppression for later. The selected tasks already check exception propagation and cleanup.

Moved to the Archive: the retry decorator covers decorator arguments (02) and pre-call validation (04). 07 covers context managers (09).
