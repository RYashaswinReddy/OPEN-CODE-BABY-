/* ============================================================================
   SPEEDRUNCODE — APP PAGE LOGIC
   ----------------------------------------------------------------------------
   Everything interactive on app.html lives here:
     1. TRACKS            — the course data (7 tracks, 44 lessons, quizzes)
     2. STATE + STORAGE   — XP, streaks and completed lessons, saved to
                            localStorage so progress survives a refresh
     3. RENDERING         — builds the track list, lesson list, lesson body
                            and quiz with DOM APIs (no innerHTML with data,
                            which keeps text safe)
     4. QUIZ + XP         — checks the answer, awards XP, updates the streak
     5. DEEP LINKING      — the URL hash (#ai-fundamentals/1) keeps the current
                            lesson shareable and makes the Back button work

   This is a classic script (no ES modules) so it runs from file:// with
   no web server.
   ============================================================================ */

(function () {
  'use strict';

  /* ==========================================================================
     1. COURSE DATA
     --------------------------------------------------------------------------
     To add or edit content, just edit this array — the UI rebuilds itself.

     Each track:  { id, title, level, blurb, lessons: [...] }
     Each lesson: { id, title, body: [paragraph, ...], quiz: {...} }
     The quiz `answer` is the INDEX of the correct option (0-based).
     ========================================================================== */
  var TRACKS = [
    {
      id: 'ai-fundamentals',
      title: 'AI Coding Fundamentals',
      level: 'Level 1',
      blurb: 'Learn what AI coding tools are, how to talk to them, and how to get unstuck fast.',
      lessons: [
        {
          id: 'af-1',
          title: 'What AI coding tools actually do',
          body: [
            'AI coding tools are autocomplete on steroids: they predict the next chunk of text based on everything you have given them to read. They are not looking up answers in a manual — they are pattern-matching against what good code looks like.',
            'That single fact drives every best practice in this course. The more relevant context you provide, the better the prediction. The vaguer your request, the more the model has to guess.'
          ],
          quiz: {
            question: 'What is an AI coding tool really doing when it suggests code?',
            options: [
              'Searching a database of pre-written answers',
              'Predicting likely text based on the context it was given',
              'Compiling and testing your code before showing it',
              'Reading documentation on your behalf'
            ],
            answer: 1
          }
        },
        {
          id: 'af-2',
          title: 'Prompting for code: context is everything',
          body: [
            'A weak prompt says “make a login form”. A strong prompt names the framework, the styling system, the fields you need, the validation rules and what happens on failure. Same tool, completely different output.',
            'Practical rule: before you hit Enter, ask whether a stranger could build the right thing from your message alone. If not, add the missing constraints.'
          ],
          quiz: {
            question: 'Which change most improves a code prompt?',
            options: [
              'Making it shorter so the model reads it faster',
              'Adding constraints: stack, requirements, edge cases and expected output',
              'Writing it in all capital letters',
              'Asking the model to “do its best”'
            ],
            answer: 1
          }
        },
        {
          id: 'af-3',
          title: 'Reading and reviewing AI output',
          body: [
            'Never accept a block of generated code you would not be able to debug. Read it the way you read a pull request from a busy colleague: check the happy path, then hunt for what it quietly assumed.',
            'Common tells are hard-coded secrets, missing error handling, invented library APIs and queries with no input validation. If you cannot explain a line, ask the model to explain it before you keep it.'
          ],
          quiz: {
            question: 'What is the safest way to handle generated code you do not understand?',
            options: [
              'Ship it — the model wrote it, so it is probably fine',
              'Ask the model to explain each part before you keep it',
              'Delete the file and start over from scratch',
              'Comment it out so it does not run'
            ],
            answer: 1
          }
        },
        {
          id: 'af-4',
          title: 'Debugging with AI when you are stuck',
          body: [
            'Do not describe the fix you want — describe the symptom. Paste the exact error, the line that triggers it and what you expected to happen instead. Models are far better at diagnosing evidence than guessing at vibes.',
            'If the first answer is wrong, resist the urge to rephrase randomly. Say what was wrong with the answer. “That did not work, the error persists because the state is set after the render” gives the model something to correct.'
          ],
          quiz: {
            question: 'You hit a runtime error. What should you give the AI first?',
            options: [
              'The exact error message, the triggering code and the expected behaviour',
              'A guess at what the fix should be',
              'A new file with the code removed',
              'Nothing — retry the same prompt'
            ],
            answer: 0
          }
        },
        {
          id: 'af-5',
          title: 'Guardrails: keeping AI honest',
          body: [
            'Models confidently invent things: package names that do not exist, method signatures that never shipped, functions from a newer version than you are running. Treat every API suggestion as unverified until it runs.',
            'Simple guardrails that catch most of it: pin your dependency versions, run the code immediately, keep a human-written test for anything load-bearing, and never let AI write code that handles money or auth without review.'
          ],
          quiz: {
            question: 'Which guardrail catches the most AI mistakes early?',
            options: [
              'Using a more expensive model',
              'Running the code and testing it immediately',
              'Asking for the answer twice',
              'Writing longer prompts'
            ],
            answer: 1
          }
        },
        {
          id: 'af-6',
          title: 'Fundamentals speed run',
          body: [
            'You have covered the loop: give context, read the output, verify with real execution, and feed failures back in. That cycle works in every tool you will meet in the later tracks.',
            'Final tip: keep a scratch file of prompts that worked well. Reusing a proven prompt is the cheapest productivity win in AI-assisted development.'
          ],
          quiz: {
            question: 'What is the healthiest default workflow with an AI coding tool?',
            options: [
              'Generate, accept, and test at the end of the week',
              'Prompt with context → read the output → run it → feed errors back',
              'Prompt, accept, and move to the next task',
              'Avoid using AI on anything important'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'cursor-mastery',
      title: 'Cursor Mastery',
      level: 'Level 2',
      blurb: 'Go from Cursor beginner to power user — Composer, agent mode, multi-file editing and more.',
      lessons: [
        {
          id: 'cm-1',
          title: 'Cursor setup and workspace tour',
          body: [
            'Cursor is a fork of VS Code, so your keybindings, themes and extensions mostly carry over. The important difference is that AI is wired into the editor itself rather than bolted on beside it.',
            'Start by opening a real project — not an empty folder. An AI with no code to read has nothing to work with, and every feature in this track assumes it can see your repository.'
          ],
          quiz: {
            question: 'What is the single most useful thing to do before starting with Cursor?',
            options: [
              'Install a different code editor alongside it',
              'Open a real project so the AI has context to read',
              'Turn off all existing keybindings',
              'Delete your configuration files'
            ],
            answer: 1
          }
        },
        {
          id: 'cm-2',
          title: 'Composer basics',
          body: [
            'Composer is where multi-file work happens. Instead of chatting about one buffer, you describe an outcome and it plans edits across the files that outcome touches.',
            'Good Composer requests are scoped: name the feature, name the files or area it belongs to, and say what must not change. Unscoped requests produce diffs that are technically clever and wrong for your codebase.'
          ],
          quiz: {
            question: 'What makes a Composer request most likely to succeed?',
            options: [
              'A one-word instruction like “refactor”',
              'Naming the feature, the affected area and what must stay the same',
              'Asking for the largest possible diff',
              'Sending the same request three times'
            ],
            answer: 1
          }
        },
        {
          id: 'cm-3',
          title: 'Agent mode in practice',
          body: [
            'Agent mode runs a loop: it reads files, edits them, runs commands and inspects the output before continuing. That loop is what makes it useful — it can catch its own failures instead of leaving them for you.',
            'It also means mistakes compound. Give agent mode a clear finish line (“make this test pass, change nothing else”), and read the terminal output it produces rather than skimming the summary.'
          ],
          quiz: {
            question: 'Why does agent mode often produce better results than a single chat reply?',
            options: [
              'It runs longer prompts',
              'It can run commands, see the output and correct itself',
              'It has access to the internet by default',
              'It never makes mistakes'
            ],
            answer: 1
          }
        },
        {
          id: 'cm-4',
          title: 'Context engineering with rules files',
          body: [
            'A rules file (for example .cursorrules, or project rules in settings) is standing context the model reads on every request: your stack, conventions, commands and things it must never do.',
            'Keep it short and imperative. “Use pnpm, not npm. All API calls go through src/lib/api.ts. Never generate a new dependency without asking.” Ten lines of sharp rules beat a hundred lines of noise the model skips.'
          ],
          quiz: {
            question: 'What belongs in a rules file?',
            options: [
              'Your entire README copied in full',
              'Short, imperative conventions the model must follow on every request',
              'The model’s own output, for reference',
              'Nothing — rules files are a gimmick'
            ],
            answer: 1
          }
        },
        {
          id: 'cm-5',
          title: 'Multi-file edits without breaking things',
          body: [
            'Cross-file changes fail in predictable places: a renamed function where one caller was missed, a type updated in three of four places, a constant moved but still imported from the old path.',
            'So give the AI a verification step, not just an edit step: “run the type checker and the tests after changing this.” A model that can run the compiler catches the very mistakes multi-file edits create.'
          ],
          quiz: {
            question: 'What is the most common failure mode of a multi-file AI edit?',
            options: [
              'The code compiles but runs slightly slower',
              'One of several call sites or imports is missed',
              'The editor crashes',
              'The file names change randomly'
            ],
            answer: 1
          }
        },
        {
          id: 'cm-6',
          title: 'A keyboard-first workflow',
          body: [
            'The speed gain in Cursor comes from never touching the mouse: hotkey to the AI panel, accept a diff, jump to the next change, re-run the last command. Each pause you remove compounds over a working day.',
            'Pick three shortcuts and use them for a week before adding more. Muscle memory beats a memorised list you have to look up.'
          ],
          quiz: {
            question: 'What is the real source of speed in a keyboard-first AI workflow?',
            options: [
            'Memorising every shortcut on day one',
              'Consistent use of a few shortcuts until they are automatic',
              'Turning off autocomplete',
              'Working without a mouse for the whole project'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'ship-with-ai',
      title: 'Ship with AI Tools',
      level: 'Level 3',
      blurb: 'Build and deploy real projects using Lovable, Replit, v0 and Bolt — fast.',
      lessons: [
        {
          id: 'sw-1',
          title: 'Choosing Lovable, v0, Bolt or Replit',
          body: [
            'These tools overlap but have centres of gravity. v0 is strongest for generated UI, Bolt for spinning up a full-stack app in the browser, Lovable for a polished product from a spec, and Replit when you want a real environment, terminal and deployment together.',
            'Pick one and finish with it. Tool-hopping in week one is procrastination wearing a research costume.'
          ],
          quiz: {
            question: 'What is the healthiest approach to choosing an AI app builder?',
            options: [
              'Try a new one every day to compare them',
              'Pick one that fits your goal and finish the project with it',
              'Choose whichever has the most features',
              'Wait until you have tested all of them'
            ],
            answer: 1
          }
        },
        {
          id: 'sw-2',
          title: 'From prompt to first draft',
          body: [
            'Write the first prompt like a one-page brief: who it is for, what it must let them do, what it must not do, and what the first screen shows. Vague briefs produce generic apps.',
            'Expect the first draft to be wrong. The goal of round one is to give yourself something concrete to react to — you steer from there.'
          ],
          quiz: {
            question: 'What should the first prompt contain?',
            options: [
              'Only the app name',
              'Audience, core actions, exclusions and the first screen',
              'A full database schema',
              'Your credit card details'
            ],
            answer: 1
          }
        },
        {
          id: 'sw-3',
          title: 'Iterating on generated UI',
          body: [
            'Give visual feedback in design language, not code language: “the header feels heavy, reduce it and let the content start higher” works better than a guess at CSS selectors.',
            'Change one thing at a time. Ten edits in a single message gives you ten changes you did not ask for mixed in with the one you did.'
          ],
          quiz: {
            question: 'How should you request UI changes?',
            options: [
              'In one message with ten unrelated requests',
              'One focused change at a time, described in visual terms',
              'By rewriting the whole prompt from scratch each time',
              'By accepting the first suggestion'
            ],
            answer: 1
          }
        },
        {
          id: 'sw-4',
          title: 'Wiring up auth and data',
          body: [
            'Auth and data are where generated apps usually break: a demo that works with hardcoded data falls over the moment real users sign in with different permissions.',
            'Connect a real backend early — even a simple one — and test with two accounts. Anything that only ever ran as you is not finished.'
          ],
          quiz: {
            question: 'When should you connect a real backend to a generated app?',
            options: [
              'Never — hardcoded data is fine',
              'Early, so auth and permissions are tested with real users',
              'Only after launch, if users complain',
              'Once the CSS is finalised'
            ],
            answer: 1
          }
        },
        {
          id: 'sw-5',
          title: 'Deploying to production',
          body: [
            'Deployment is a checklist, not a mystery: environment variables set on the host (never committed to the repo), a production database, a domain, and error monitoring so you hear about failures before your users do.',
            'Ship the smallest working version to a real URL today. A deployed app with three features teaches you more than a perfect one that only runs on your laptop.'
          ],
          quiz: {
            question: 'Where do secrets like API keys belong in production?',
            options: [
              'Committed to the repository for convenience',
              'In environment variables set on the hosting platform',
              'Hard-coded in the frontend',
              'Sent from the client at runtime'
            ],
            answer: 1
          }
        },
        {
          id: 'sw-6',
          title: 'Your first shipped weekend build',
          body: [
            'A weekend build works when the scope is brutal: one user, one job, one screen that does it. Write the scope down and cross out everything that is not required for a stranger to finish the core task.',
            'Then follow the loop from this track — brief, draft, iterate, wire data, deploy — and stop adding features at noon on Sunday. Shipping is a skill, and it is practised by finishing.'
          ],
          quiz: {
            question: 'What makes a weekend project actually ship?',
            options: [
              'A large feature list completed quickly',
              'A deliberately tiny scope that you see through to a live URL',
              'Waiting for the design to feel perfect',
              'Starting three projects instead of one'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'no-code-builders',
      title: 'No-Code App Builders',
      level: 'Level 3',
      blurb: 'Build real web and mobile apps without writing code — Bubble, Webflow, FlutterFlow and Glide from zero to shipped.',
      lessons: [
        {
          id: 'nc-1',
          title: 'Bubble vs Webflow vs FlutterFlow vs Glide',
          body: [
            'Bubble builds data-driven web applications, Webflow builds marketing sites and content pages, FlutterFlow builds native-feeling mobile apps, and Glide turns spreadsheets into apps.',
            'The right choice follows your data and your platform, not the loudest marketing. Ask “where does my data live and what device is the user on?” and the answer is usually obvious.'
          ],
          quiz: {
            question: 'What should decide which no-code tool you use?',
            options: [
              'Which one has the most templates',
              'Where your data lives and which device the user is on',
              'Which has the most expensive plan',
              'Which one a friend mentioned once'
            ],
            answer: 1
          }
        },
        {
          id: 'nc-2',
          title: 'Data models without code',
          body: [
            'No-code tools fail when the data model is an afterthought. Define your things first — Users, Projects, Comments — then the fields each one carries, then how they relate.',
            'Get this right and the rest of the builder is easy. Get it wrong and you spend a weekend rebuilding every screen that displays the data.'
          ],
          quiz: {
            question: 'What should you design first in a no-code project?',
            options: [
              'The colour palette',
              'The data model: entities, fields and relationships',
              'The navigation menu',
              'The app icon'
            ],
            answer: 1
          }
        },
        {
          id: 'nc-3',
          title: 'Building your first Bubble app',
          body: [
            'Bubble runs on three ideas: things (your data), elements (your interface) and workflows (what happens when). Learn to see every feature as those three parts and the editor stops being intimidating.',
            'Build one complete workflow end to end before duplicating the pattern. A half-built feature teaches you less than one boring feature that genuinely works.'
          ],
          quiz: {
            question: 'What are Bubble’s three core building blocks?',
            options: [
              'Pages, files and folders',
              'Things, elements and workflows',
              'HTML, CSS and JavaScript',
              'Inputs, outputs and loops'
            ],
            answer: 1
          }
        },
        {
          id: 'nc-4',
          title: 'Responsive layouts in Webflow',
          body: [
            'Design desktop-first, then fix breakpoints in descending order — tablet, then mobile — because each smaller breakpoint inherits from the one above it.',
            'The most common mobile failure is fixed widths. Use relative units and let content flow, or you will spend hours fighting elements that will not shrink.'
          ],
          quiz: {
            question: 'What most often breaks a Webflow layout on mobile?',
            options: [
              'Fixed pixel widths that refuse to shrink',
              'Too many colour variables',
              'Using flexbox instead of grid',
              'Alt text on images'
            ],
            answer: 0
          }
        },
        {
          id: 'nc-5',
          title: 'FlutterFlow mobile flows',
          body: [
            'FlutterFlow gives you real app structure: pages, widgets and actions, plus an optional code view when you need to see what it generated.',
            'Treat navigation as a map before you build screens. Sketch the path a new user takes in three taps, then build only the screens on that path.'
          ],
          quiz: {
            question: 'What should you define before building mobile screens?',
            options: [
              'The full navigation path a user takes',
              'The app’s monetisation model',
              'The splash screen animation',
              'The push notification schedule'
            ],
            answer: 0
          }
        },
        {
          id: 'nc-6',
          title: 'Glide data-sheet apps',
          body: [
            'Glide is fastest when your data already looks like a spreadsheet: rows, columns, a few relations. Connect a sheet, pick a layout per screen, and you have a usable internal tool in an afternoon.',
            'That speed has a ceiling. When you need logic the sheet cannot express, that is your signal to move to a fuller builder.'
          ],
          quiz: {
            question: 'When is Glide the strongest choice?',
            options: [
              'For a complex social network',
              'When your data is already row-and-column shaped and you need speed',
              'For 3D games',
              'When you want to write extensive code'
            ],
            answer: 1
          }
        },
        {
          id: 'nc-7',
          title: 'Shipping and scaling no-code',
          body: [
            'Before launch: test with real data (empty apps hide every bug), set permissions so one user cannot read another’s records, and export your data so you are never locked in.',
            'No-code gets you to product-market fit fast. Plan the exit path early — most tools export or expose an API — so growth never means starting over.'
          ],
          quiz: {
            question: 'What should you check before launching a no-code app?',
            options: [
              'That the logo is pixel-perfect',
              'Permissions, real-data testing and an export path for your data',
              'That you have ten integrations installed',
              'Nothing — no-code apps are launch-ready by default'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'backend-database',
      title: 'Backend & Database',
      level: 'Level 4',
      blurb: 'Every app needs data. Learn Airtable, Xano, Supabase and Firebase — from fake backends to production-grade APIs.',
      lessons: [
        {
          id: 'bd-1',
          title: 'Why every app needs a backend',
          body: [
            'Anything stored only in the browser belongs to the user’s device: clear the cache and it is gone, and anyone can edit it. A backend is simply a trusted place that holds the truth and enforces the rules.',
            'The moment a second user exists — or money, or private data — you need one. Everything in this track is about choosing that place quickly and correctly.'
          ],
          quiz: {
            question: 'What is the fundamental job of a backend?',
            options: [
              'Making the interface look better',
              'Holding the authoritative data and enforcing who may change it',
              'Compiling CSS',
              'Caching images'
            ],
            answer: 1
          }
        },
        {
          id: 'bd-2',
          title: 'Supabase fundamentals',
          body: [
            'Supabase gives you a Postgres database, authentication, file storage and auto-generated APIs. Because it is real Postgres, you can outgrow it using SQL you already know.',
            'Its security model lives in row level policies. Auth decides who you are; policies decide which rows you may touch. Skipping them is the classic “my app leaked everyone’s data” mistake.'
          ],
          quiz: {
            question: 'What controls which rows a user may read or write in Supabase?',
            options: [
              'Row level security policies',
              'The frontend CSS',
              'The storage bucket name',
              'The API rate limit'
            ],
            answer: 0
          }
        },
        {
          id: 'bd-3',
          title: 'Firebase in practice',
          body: [
            'Firebase is document-based and realtime by default: clients subscribe to a document and update instantly when it changes. That makes collaborative and live interfaces remarkably cheap to build.',
            'The trade-off is that your logic lives in security rules rather than server code. Write and test those rules explicitly, because a permissive rule set exposes every document.'
          ],
          quiz: {
            question: 'What is Firebase’s defining characteristic?',
            options: [
              'Relational joins across many tables',
              'Realtime document sync with rules-based security',
              'Manual server provisioning',
              'SQL-only access'
            ],
            answer: 1
          }
        },
        {
          id: 'bd-4',
          title: 'Airtable as a quick backend',
          body: [
            'Airtable is a spreadsheet that behaves like a database, which makes it ideal when your collaborators are non-technical and your relationships are simple.',
            'Treat it as a prototype backend. It is brilliant until you need tight performance, complex queries or enforced integrity — then move the data, not the whole product.'
          ],
          quiz: {
            question: 'When is Airtable the right backend?',
            options: [
              'When you need millions of rows and heavy transactions',
              'When relationships are simple and non-technical people must edit the data',
              'When you require strict SQL constraints',
              'Never — it is only a spreadsheet'
            ],
            answer: 1
          }
        },
        {
          id: 'bd-5',
          title: 'Xano for visual APIs',
          body: [
            'Xano generates a real API from visual logic: you build functions, chain steps and get endpoints, auth and a database without writing server code.',
            'Use it when your app needs server-side logic — aggregations, third-party calls, permission checks — but you do not want to maintain a codebase for it.'
          ],
          quiz: {
            question: 'What does Xano give you?',
            options: [
              'A visual way to build backend logic exposed as a real API',
              'A CSS framework',
              'A mobile app store',
              'A version control system'
            ],
            answer: 0
          }
        },
        {
          id: 'bd-6',
          title: 'Auth, rules and production data',
          body: [
            'Production data means three things you must get right: passwords and tokens hashed and never logged, every access path checked server-side, and backups you have actually restored once.',
            'Remember the rule: the client is a suggestion box, not an authority. Validate on the client for friendliness, on the server for safety.'
          ],
          quiz: {
            question: 'Where must authorisation really be enforced?',
            options: [
              'Only in the frontend',
              'On the server, for every access path',
              'In the database password',
              'In the app’s CSS'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'automation',
      title: 'Automation & Workflows',
      level: 'Level 4',
      blurb: 'Connect your tools, eliminate manual work, and build systems that run themselves — Zapier, Make, and n8n.',
      lessons: [
        {
          id: 'au-1',
          title: 'Thinking in triggers and actions',
          body: [
            'Every automation is the same shape: a trigger (something happened) followed by actions (do these things in response). If you cannot name the trigger in one sentence, the automation is not ready to build.',
            'Write the sentence first — “when a form is submitted, create a task and notify the team” — and the rest is assembly.'
          ],
          quiz: {
            question: 'What are the two parts of any automation?',
            options: [
              'Design and deployment',
              'A trigger and the actions that follow it',
              'Inputs and outputs of the database',
              'Frontend and backend'
            ],
            answer: 1
          }
        },
        {
          id: 'au-2',
          title: 'Zapier quick wins',
          body: [
            'Zapier has the largest app catalogue, so it is where you get your first win: a form to a spreadsheet to a message, in about ten minutes.',
            'Start with a workflow that runs several times a day. Frequent, boring tasks give you fast feedback and a visible time saving on day one.'
          ],
          quiz: {
            question: 'What is the best first automation to build?',
            options: [
              'A monthly report nobody reads',
              'A frequent, repetitive task you do every day',
              'A workflow with fifteen steps',
              'Something involving your own database backups'
            ],
            answer: 1
          }
        },
        {
          id: 'au-3',
          title: 'Make scenario design',
          body: [
            'Make shows you the flow visually, with branching, iterators and routers. That visibility is a gift: you can see exactly where a run went wrong instead of guessing.',
            'Design for failure. Split complex flows into modules, handle the empty case explicitly, and always end with a step that tells you the run failed.'
          ],
          quiz: {
            question: 'Why do complex automations need explicit error handling?',
            options: [
              'Because platforms never fail silently',
              'Because a failed run should notify you instead of stopping quietly',
              'Because it makes the scenario run faster',
              'Because it reduces the price'
            ],
            answer: 1
          }
        },
        {
          id: 'au-4',
          title: 'n8n for developers',
          body: [
            'n8n is self-hostable and lets you drop into JavaScript between steps, which makes it the choice when you need custom logic or must keep data on your own infrastructure.',
            'Self-hosting means you own the uptime. Run it where you can see the logs, and back it up with the same seriousness as the database it points at.'
          ],
          quiz: {
            question: 'When is n8n the right tool?',
            options: [
              'When you need custom code and self-hosting',
              'When you want zero configuration ever',
              'When you have no server at all',
              'Only for mobile apps'
            ],
            answer: 0
          }
        },
        {
          id: 'au-5',
          title: 'Error handling and retries',
          body: [
            'External services fail: rate limits, timeouts, a third party having a bad afternoon. Configure retries with backoff, and never let a failed run fail silently.',
            'The most valuable automation you will build is the one that messages you when everything else breaks.'
          ],
          quiz: {
            question: 'What does “fail silently” mean for an automation?',
            options: [
              'It fails without anyone being notified',
              'It retries immediately forever',
              'It deletes its own data',
              'It runs faster than expected'
            ],
            answer: 0
          }
        },
        {
          id: 'au-6',
          title: 'Your first hands-off system',
          body: [
            'A system is more than one automation: trigger, action, error path, log, and an owner (you) who checks it weekly. Build two or three that share data and the manual work genuinely disappears.',
            'Audit monthly. Automations rot as tools change, and a broken one you have forgotten about is worse than no automation at all.'
          ],
          quiz: {
            question: 'How should you maintain automations over time?',
            options: [
              'Build them once and never look again',
              'Audit them regularly — broken ones you forgot about are worse than none',
              'Rebuild them from scratch each month',
              'Disable logging to save space'
            ],
            answer: 1
          }
        }
      ]
    },

    {
      id: 'ai-agents-money',
      title: 'AI Agents & Monetization',
      level: 'Level 5',
      blurb: 'Deploy AI agents that work for you, add payments to anything, and use AI as your product architect.',
      lessons: [
        {
          id: 'am-1',
          title: 'What makes an agent an agent',
          body: [
            'A chat model answers one question. An agent has a goal, can take actions in the world and decides its next step based on what happened last. The loop — observe, decide, act — is the whole difference.',
            'That loop is also the risk. Every action an agent can take is an action it can take wrongly, so capability and guardrails must grow together.'
          ],
          quiz: {
            question: 'What separates an agent from a normal chat model?',
            options: [
              'It has a larger context window',
              'It can take actions and choose its next step based on results',
              'It never refuses requests',
              'It is always connected to the internet'
            ],
            answer: 1
          }
        },
        {
          id: 'am-2',
          title: 'Voiceflow agent design',
          body: [
            'Voiceflow maps conversations visually: nodes for what the agent says and does, with handoffs to a human when confidence is low.',
            'Design the unhappy path first — the confused, angry or off-topic user — because that is where scripted agents leak credibility. Give every dead end an exit to a person.'
          ],
          quiz: {
            question: 'What should you design first for a conversational agent?',
            options: [
              'The perfect happy path',
              'The unhappy path: confused, angry or off-topic users',
              'The greeting animation',
              'The pricing page'
            ],
            answer: 1
          }
        },
        {
          id: 'am-3',
          title: 'Lindy for personal automation',
          body: [
            'Lindy-style assistants handle the repetitive knowledge work — summarising inboxes, drafting replies, routing requests — against your own tools and data.',
            'Start with one recurring chore and give it strict boundaries: which mailbox, which actions, and what it must never do without asking. Broad permissions plus autonomy is how agents get you into trouble.'
          ],
          quiz: {
            question: 'How should you start with a personal AI assistant?',
            options: [
              'Give it full access to everything immediately',
              'Start with one task and strict, explicit boundaries',
              'Let it decide its own permissions',
              'Ask it to run your finances'
            ],
            answer: 1
          }
        },
        {
          id: 'am-4',
          title: 'Adding Stripe payments',
          body: [
            'Payments turn a project into a product: a price, a checkout, a webhook that fires when the money actually arrives, and a way to grant or revoke access.',
            'Trust the webhook, not the browser. The client returning to your “success” page proves nothing — only the payment event from the provider does.'
          ],
          quiz: {
            question: 'What is the reliable signal that a payment succeeded?',
            options: [
              'The user reached your success page',
              'The payment provider’s webhook event',
              'The user saying they paid',
              'The checkout page loading'
            ],
            answer: 1
          }
        },
        {
          id: 'am-5',
          title: 'Using AI as your product architect',
          body: [
            'Before writing code, ask AI to challenge your plan: what breaks at 10× users, which assumptions are weakest, what would a senior engineer cut. It is a free, tireless second opinion.',
            'Then make the decisions yourself. Architects are accountable for trade-offs — an AI will happily propose three approaches and take none of the blame when two are wrong.'
          ],
          quiz: {
            question: 'What is the best pre-build use of AI?',
            options: [
              'Letting it silently choose all your trade-offs',
              'Having it stress-test your plan while you make the decisions',
              'Skipping planning entirely',
              'Generating the logo first'
            ],
            answer: 1
          }
        },
        {
          id: 'am-6',
          title: 'Measuring and improving agents',
          body: [
            'You cannot improve what you do not measure: log every run, track resolution rate, escalation rate and cost per run, and review a sample of real transcripts weekly.',
            'Improvement comes from that sample, not from tweaking the prompt blindly. Read where it failed, then change one thing and watch the numbers move.'
          ],
          quiz: {
            question: 'What is the fastest way to improve an agent?',
            options: [
              'Rewrite the whole prompt from scratch weekly',
              'Review real transcripts, find failure patterns and change one thing',
              'Raise the temperature setting',
              'Add more tools at random'
            ],
            answer: 1
          }
        },
        {
          id: 'am-7',
          title: 'Launch checklist',
          body: [
            'Before you charge anyone: payments tested with a real card, webhooks verified, a refund path, permissions reviewed, monitoring and alerts in place, and terms that describe exactly what the product does.',
            'Then launch to ten people you can talk to directly. Ten honest users beat a thousand silent sign-ups, and you will know what to build next by Thursday.'
          ],
          quiz: {
            question: 'What is the smartest first audience for a paid product?',
            options: [
              'A thousand anonymous sign-ups',
              'Ten real users you can talk to directly',
              'Only your own test accounts',
              'Nobody until it is perfect'
            ],
            answer: 1
          }
        }
      ]
    }
  ];

  /* ==========================================================================
     2. STATE + PERSISTENCE
     --------------------------------------------------------------------------
     The whole state is a small object: XP, streak, and which lessons are done.
     localStorage keeps it between visits. Every call is wrapped in try/catch
     because some browsers block storage in private mode or on file://.
     ========================================================================== */

  var STORAGE_KEY = 'speedruncode.demo.v1';
  var XP_PER_LESSON = 25;   // XP awarded the first time you pass a lesson
  var XP_PER_LEVEL = 100;   // XP needed to advance one level

  /* Totals are computed from the data, never hard-coded in three places. */
  var TOTAL_LESSONS = TRACKS.reduce(function (n, t) { return n + t.lessons.length; }, 0);

  var DEFAULT_STATE = { xp: 0, streak: 0, lastStudyDay: null, completed: {} };

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE);
      var parsed = JSON.parse(raw);
      // Sanity check: if the shape is wrong, start fresh rather than crash.
      if (!parsed || typeof parsed.xp !== 'number' || typeof parsed.completed !== 'object') {
        return Object.assign({}, DEFAULT_STATE);
      }
      return Object.assign({}, DEFAULT_STATE, parsed);
    } catch (err) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Storage unavailable — the demo still works for this session. */
    }
  }

  var state = loadState();

  /* Which lesson is on screen. Kept in the URL hash so you can link to it
     (the Home page links here as app.html#ai-fundamentals/1). */
  var currentTrackId = TRACKS[0].id;
  var currentLessonIndex = 0;

  /* ==========================================================================
     3. SMALL DOM HELPERS
     --------------------------------------------------------------------------
     createElement + textContent instead of innerHTML: text set through
     textContent can never be interpreted as HTML, which is the safe default.
     ========================================================================== */

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === 'className') node.className = props[key];
        else if (key === 'text') node.textContent = props[key];
        else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2).toLowerCase(), props[key]);
        else node.setAttribute(key, props[key]);
      });
    }
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  function $(id) { return document.getElementById(id); }

  function findTrack(id) {
    for (var i = 0; i < TRACKS.length; i++) {
      if (TRACKS[i].id === id) return { track: TRACKS[i], index: i };
    }
    return null;
  }

  /* Local calendar day as YYYY-MM-DD — used for the streak.
     Built from local time (not toISOString) so the streak changes at
     midnight where the learner actually lives. */
  function todayKey(date) {
    var d = date || new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  /* ==========================================================================
     4a. RENDER — TRACK LIST (sidebar)
     ========================================================================== */
  function renderTracks() {
    var list = $('track-list');
    list.textContent = '';

    TRACKS.forEach(function (track) {
      var isActive = track.id === currentTrackId;
      var done = track.lessons.filter(function (l) { return state.completed[l.id]; }).length;

      var button = el('button', {
        type: 'button',
        className:
          'flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-base ' +
          (isActive
            ? 'bg-brand-700 font-semibold text-white'
            : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-800'),
        /* aria-current="true" marks the selected track for screen readers. */
        'aria-current': isActive ? 'true' : null,
        onClick: function () { selectTrack(track.id); }
      }, [
        el('span', { text: track.title }),
        el('span', {
          className: 'text-sm ' + (isActive ? 'text-brand-100' : 'text-slate-600'),
          text: done + '/' + track.lessons.length
        })
      ]);

      // aria-current=null should not render as an attribute.
      if (!isActive) button.removeAttribute('aria-current');

      list.appendChild(el('li', {}, [button]));
    });
  }

  /* ==========================================================================
     4b. RENDER — LESSON LIST (sidebar, inside the active track)
     ========================================================================== */
  function renderLessons() {
    var found = findTrack(currentTrackId);
    if (!found) return;
    var track = found.track;

    $('lessons-track-name').textContent = track.title;

    var list = $('lesson-list');
    list.textContent = '';

    track.lessons.forEach(function (lesson, i) {
      var isDone = !!state.completed[lesson.id];
      var isCurrent = i === currentLessonIndex;

      var button = el('button', {
        type: 'button',
        className:
          'flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-base ' +
          (isCurrent ? 'bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-300'
                     : 'font-medium text-slate-700 hover:bg-slate-100'),
        'aria-current': isCurrent ? 'true' : null,
        onClick: function () { openLesson(currentTrackId, i, true); }
      }, [
        /* Status dot: a tick for completed, the number otherwise.
           The meaning is repeated in sr-only text, so the icon itself
           is hidden from assistive tech. */
        el('span', {
          className:
            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ' +
            (isDone ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'),
          'aria-hidden': 'true',
          text: isDone ? '✓' : String(i + 1)
        }),
        el('span', {}, [
          el('span', { text: lesson.title }),
          el('span', { className: 'sr-only', text: isDone ? ' (completed)' : ' (not completed)' })
        ])
      ]);
      if (!isCurrent) button.removeAttribute('aria-current');

      list.appendChild(el('li', {}, [button]));
    });
  }

  /* ==========================================================================
     4c. RENDER — LESSON BODY + QUIZ (main column)
     ========================================================================== */
  function renderLesson(moveFocus) {
    var found = findTrack(currentTrackId);
    if (!found) return;
    var track = found.track;
    var lesson = track.lessons[currentLessonIndex];
    if (!lesson) return;

    var panel = $('lesson-panel');
    panel.textContent = '';   // clear previous content

    /* --- Breadcrumb / position --- */
    var trackIndex = found.index;
    panel.appendChild(el('p', {
      className: 'text-sm font-semibold uppercase tracking-wide text-brand-700',
      text: 'Track ' + (trackIndex + 1) + ' of ' + TRACKS.length + ' · Lesson ' +
            (currentLessonIndex + 1) + ' of ' + track.lessons.length
    }));

    /* --- Title (tabindex="-1" so we can move focus here programmatically) --- */
    var title = el('h2', {
      id: 'lesson-title',
      tabIndex: '-1',
      className: 'mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl',
      text: lesson.title
    });
    panel.appendChild(title);

    /* --- Completed badge --- */
    if (state.completed[lesson.id]) {
      panel.appendChild(el('p', {
        className: 'mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-base font-semibold text-emerald-800 ring-1 ring-emerald-300'
      }, [
        el('span', { 'aria-hidden': 'true', text: '✓' }),
        el('span', { text: 'Completed · ' + XP_PER_LESSON + ' XP earned' })
      ]));
    }

    /* --- Lesson copy --- */
    var body = el('div', { className: 'mt-5 space-y-4 text-slate-700' });
    lesson.body.forEach(function (paragraph) {
      body.appendChild(el('p', { text: paragraph }));
    });
    panel.appendChild(body);

    /* --- Track blurb shown once, above the quiz --- */
    panel.appendChild(el('p', {
      className: 'mt-5 rounded-xl border-l-4 border-brand-600 bg-brand-50 p-4 text-base text-slate-700',
      text: track.blurb
    }));

    /* --- QUIZ -------------------------------------------------------------
         Built as a real <form> with a <fieldset>/<legend>: screen readers
         announce the question as the group label, and radio inputs keep
         native keyboard behaviour (Tab enters the group, arrows move
         between options) for free.
       ------------------------------------------------------------------ */
    var feedback = el('p', {
      id: 'quiz-feedback',
      /* role="status" + aria-live means the result is announced without
         stealing focus from the answer the user just chose. */
      role: 'status',
      'aria-live': 'polite',
      className: 'mt-4 text-base font-semibold min-h-[1.75rem]',
      text: ''
    });

    var fieldset = el('fieldset', { className: 'mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6' });
    fieldset.appendChild(el('legend', {
      className: 'px-2 font-display text-lg font-semibold text-slate-900',
      text: 'Quiz — ' + lesson.quiz.question
    }));

    var optionsBox = el('div', { className: 'mt-4 space-y-2.5' });
    var LETTERS = ['A', 'B', 'C', 'D'];

    lesson.quiz.options.forEach(function (optionText, i) {
      /* Each option = a wrapping <label> containing a visually hidden radio
         and a styled <span>. The span sits AFTER the input, which is what
         lets Tailwind's `peer-checked:` variant style it. The input keeps
         its real focusable, announced state. */
      var input = el('input', {
        type: 'radio',
        name: 'quiz-answer',
        value: String(i),
        className: 'peer sr-only'
      });

      var row = el('span', {
        className:
          'flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 ' +
          'text-base text-slate-800 transition ' +
          'hover:border-brand-300 ' +
          'peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-medium ' +
          'peer-focus-visible:ring-4 peer-focus-visible:ring-brand-300'
      }, [
        el('span', {
          className:
            'grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-slate-700 bg-slate-100',
          'aria-hidden': 'true',
          text: LETTERS[i]
        }),
        el('span', { text: optionText })
      ]);

      optionsBox.appendChild(el('label', { className: 'block' }, [input, row]));
    });

    fieldset.appendChild(optionsBox);
    panel.appendChild(fieldset);

    /* --- Buttons --- */
    var buttons = el('div', { className: 'mt-5 flex flex-wrap items-center gap-3' });

    var checkBtn = el('button', {
      type: 'submit',
      id: 'check-answer',
      className: 'rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white hover:bg-brand-800',
      text: 'Check answer',
      onClick: function (event) { event.preventDefault(); checkAnswer(); }
    });

    var prevBtn = el('button', {
      type: 'button',
      className: 'rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-100',
      onClick: function () { goRelative(-1); },
      text: '← Previous'
    });

    /* Decide what "Next" does BEFORE building the button so it only ever
       has a single click handler:
         • middle of a track  → the next lesson in this track
         • end of a track     → the first lesson of the next track
         • end of the whole course → disabled, there is nothing after it */
    var isLast = currentLessonIndex === track.lessons.length - 1;
    var hasTrackAfter = found.index < TRACKS.length - 1;

    var nextLabel = 'Next lesson →';
    var nextAction = function () { goRelative(1); };
    var nextDisabled = false;

    if (isLast && hasTrackAfter) {
      nextLabel = 'Next track →';
      nextAction = function () { openLesson(TRACKS[found.index + 1].id, 0, true); };
    } else if (isLast) {
      nextDisabled = true;          // last lesson of the last track
    }

    var nextBtn = el('button', {
      type: 'button',
      className: 'rounded-xl border-2 border-slate-300 px-5 py-3 text-base font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-100',
      onClick: nextAction,
      text: nextLabel
    });

    /* Disable (rather than hide) at the ends so the layout stays put and
       the control is still discoverable. */
    if (currentLessonIndex === 0) {
      prevBtn.disabled = true;
      prevBtn.classList.add('opacity-40', 'cursor-not-allowed');
    }
    if (nextDisabled) {
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-40', 'cursor-not-allowed');
    }

    buttons.appendChild(prevBtn);
    buttons.appendChild(checkBtn);
    buttons.appendChild(nextBtn);
    panel.appendChild(buttons);
    panel.appendChild(feedback);

    /* --- Track-complete note under the last lesson --- */
    if (isLast) {
      panel.appendChild(el('p', {
        className: 'mt-6 rounded-xl bg-slate-100 p-4 text-base text-slate-700',
        text: 'You have reached the end of “' + track.title + '”. Use “Next track” to carry on.'
      }));
    }

    /* Move focus to the heading after a user-initiated navigation so
       keyboard and screen reader users are placed in the new content. */
    if (moveFocus) title.focus();
  }

  /* ==========================================================================
     4d. RENDER — STATS (right column)
     ========================================================================== */
  function renderStats() {
    var level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
    var intoLevel = state.xp % XP_PER_LEVEL;
    var levelPct = Math.round((intoLevel / XP_PER_LEVEL) * 100);
    var done = Object.keys(state.completed).filter(function (k) { return state.completed[k]; }).length;
    var coursePct = Math.round((done / TOTAL_LESSONS) * 100);

    $('stat-level').textContent = String(level);
    $('stat-xp').textContent = String(state.xp);
    $('stat-level-fill').style.width = levelPct + '%';
    $('stat-level-bar').setAttribute('aria-valuenow', String(levelPct));
    $('stat-level-text').textContent = intoLevel + ' / ' + XP_PER_LEVEL + ' XP to the next level';

    $('stat-streak').textContent = String(state.streak);
    $('stat-streak-hint').textContent = state.streak > 0
      ? 'Keep it alive — answer a quiz today.'
      : 'Answer a quiz correctly to start a streak.';

    $('stat-done').textContent = String(done);
    $('stat-total').textContent = ' / ' + TOTAL_LESSONS;
    $('stat-course-fill').style.width = coursePct + '%';
    $('stat-course-bar').setAttribute('aria-valuenow', String(done));
    $('stat-course-bar').setAttribute('aria-valuemax', String(TOTAL_LESSONS));

    var cert = $('stat-certificate');
    if (done >= TOTAL_LESSONS) cert.classList.remove('hidden');
    else cert.classList.add('hidden');
  }

  function renderAll(moveFocus) {
    renderTracks();
    renderLessons();
    renderLesson(moveFocus);
    renderStats();
  }

  /* ==========================================================================
     5. QUIZ + XP + STREAK
     ========================================================================== */
  function checkAnswer() {
    var found = findTrack(currentTrackId);
    var lesson = found.track.lessons[currentLessonIndex];
    var feedback = $('quiz-feedback');

    var selected = document.querySelector('input[name="quiz-answer"]:checked');

    if (!selected) {
      feedback.textContent = 'Choose an answer first, then press “Check answer”.';
      feedback.className = 'mt-4 text-base font-semibold min-h-[1.75rem] text-slate-700';
      return;                      // ← no exception, we simply tell the user
    }

    var chosen = parseInt(selected.value, 10);

    if (chosen !== lesson.quiz.answer) {
      feedback.textContent = 'Not quite — have another go. Re-read the lesson above.';
      feedback.className = 'mt-4 text-base font-semibold min-h-[1.75rem] text-rose-700';
      return;
    }

    /* --- Correct answer --- */
    var firstTime = !state.completed[lesson.id];
    if (firstTime) {
      state.completed[lesson.id] = true;
      state.xp += XP_PER_LESSON;
      updateStreak();
      saveState();
      renderTracks();      // sidebar counts change
      renderLessons();     // tick appears
      renderStats();       // XP, level, progress bars change
    }

    feedback.textContent = firstTime
      ? 'Correct! Lesson complete — ' + XP_PER_LESSON + ' XP earned. 🔥'
      : 'Correct! You already completed this lesson, so no extra XP.';
    feedback.className = 'mt-4 text-base font-semibold min-h-[1.75rem] text-emerald-700';
  }

  /* Streak rules: same day → unchanged; previous calendar day → +1;
     any gap → restart at 1. */
  function updateStreak() {
    var today = todayKey();
    if (state.lastStudyDay === today) return;

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    state.streak = (state.lastStudyDay === todayKey(yesterday)) ? state.streak + 1 : 1;
    state.lastStudyDay = today;
  }

  /* ==========================================================================
     6. NAVIGATION + DEEP LINKING
     --------------------------------------------------------------------------
     The URL hash looks like #cursor-mastery/3 (track id / 1-based lesson).
     That makes every lesson linkable from the Home page and lets the
     browser Back button move between lessons you have visited.
     ========================================================================== */
  function writeHash(trackId, lessonNumber) {
    var next = '#' + trackId + '/' + lessonNumber;
    if (location.hash !== next) location.hash = next;   // fires hashchange
  }

  function parseHash() {
    var raw = location.hash.replace(/^#/, '');
    if (!raw) return null;
    var parts = raw.split('/');
    var found = findTrack(parts[0]);
    if (!found) return null;
    var n = parseInt(parts[1], 10);
    if (isNaN(n) || n < 1 || n > found.track.lessons.length) n = 1;
    return { trackId: parts[0], lessonIndex: n - 1 };
  }

  function openLesson(trackId, lessonIndex, updateUrl) {
    currentTrackId = trackId;
    currentLessonIndex = lessonIndex;
    renderAll(true);                       // true → move focus to the heading
    if (updateUrl) writeHash(trackId, lessonIndex + 1);
  }

  function selectTrack(trackId, lessonIndex, updateUrl) {
    openLesson(trackId, lessonIndex || 0, updateUrl !== false);
  }

  /* Step forward/back inside the current track; at the end of a track,
     step 1 moves to the first lesson of the next track. */
  function goRelative(delta) {
    var found = findTrack(currentTrackId);
    var nextIndex = currentLessonIndex + delta;

    if (nextIndex < 0) return;
    if (nextIndex < found.track.lessons.length) {
      openLesson(currentTrackId, nextIndex, true);
      return;
    }
    if (found.index < TRACKS.length - 1) {
      openLesson(TRACKS[found.index + 1].id, 0, true);
    }
  }

  /* The browser Back/Forward buttons fire hashchange — re-render to match. */
  window.addEventListener('hashchange', function () {
    var parsed = parseHash();
    if (!parsed) return;
    if (parsed.trackId === currentTrackId && parsed.lessonIndex === currentLessonIndex) return;
    openLesson(parsed.trackId, parsed.lessonIndex, false);   // don't rewrite the hash
  });

  /* ==========================================================================
     7. RESET
     ========================================================================== */
  $('reset-progress').addEventListener('click', function () {
    // confirm() is blocking but perfectly accessible: it is a native dialog
    // with a real focus trap and keyboard support.
    if (!window.confirm('Reset all XP, streaks and completed lessons? This cannot be undone.')) return;
    state = Object.assign({}, DEFAULT_STATE, { completed: {} });
    saveState();
    renderAll(false);
  });

  /* ==========================================================================
     8. START
     --------------------------------------------------------------------------
     Deep links such as index.html#ai-fundamentals/1 land on the right lesson;
     with no hash, we begin at the first lesson of the first track.
     ========================================================================== */
  var initial = parseHash();
  if (initial) {
    currentTrackId = initial.trackId;
    currentLessonIndex = initial.lessonIndex;
  }
  renderAll(false);

})();
