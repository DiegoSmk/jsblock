# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.6.1](https://github.com/DiegoSmk/jsblock/compare/v0.5.3...v0.6.1) (2026-02-09)


### 🎨 UI/UX

* neutralize git panel colors and align with app theme ([575498d](https://github.com/DiegoSmk/jsblock/commit/575498db66bbf275dde99b1dcb91239fc680576c))


### ⚡ Performance

* **editor:** memoize defaultEdgeOptions in FlowContent ([681d7fb](https://github.com/DiegoSmk/jsblock/commit/681d7fbf3df926e37984fda9a147902406e57d7d))
* memoize defaultEdgeOptions in FlowContent to prevent re-renders ([14092ee](https://github.com/DiegoSmk/jsblock/commit/14092ee44f2401f575ff2ff27e33b590338c8e53))
* optimize FlowContent node filtering ([4962ef8](https://github.com/DiegoSmk/jsblock/commit/4962ef88894f08248d6f45bb1e5c1773437d6749))
* optimize mcp:sync-state with non-blocking I/O ([f68d937](https://github.com/DiegoSmk/jsblock/commit/f68d937ad2b3561102299c7a3846e182fa0dacb5))
* Optimize recent environments validation with bulk IPC check ([b48a797](https://github.com/DiegoSmk/jsblock/commit/b48a7972cd9baa6cb196429b741ef957144be063))
* replace N+1 file reads with bulk IPC call ([64eed9c](https://github.com/DiegoSmk/jsblock/commit/64eed9c8f8b507cffd8fc3977c4c6b550f0b52d6))
* use async fs.writeFile for state persistence ([c6e4beb](https://github.com/DiegoSmk/jsblock/commit/c6e4beb4c6c72f59a42ebf4e2b3d00e362b3d1cf))
* Use async I/O in MCP server to prevent blocking ([592028c](https://github.com/DiegoSmk/jsblock/commit/592028c4653ad75d0de204ae4f640e6c10c36c84))
* Use WriteStream for async logging in main process ([f2e8072](https://github.com/DiegoSmk/jsblock/commit/f2e8072e53354c7bb5b9140badc01c5c12e3fe96))


### 🧹 Miscellaneous

* cleanup codebase, consolidate types, and improve worker robustness ([c6ce751](https://github.com/DiegoSmk/jsblock/commit/c6ce751cefe77a4f4a628000be9217f5c7609187))
* finalize integration of search, git, and quick-open features ([6f71383](https://github.com/DiegoSmk/jsblock/commit/6f71383aaed65adb9481882aded3b5db75187bbd))
* fix all remaining lint errors and optimize tests ([a3a16b6](https://github.com/DiegoSmk/jsblock/commit/a3a16b6e247f55bd5d9e41ac5093e330c0b5f0f0))
* resolve package-lock.json conflict by regenerating ([5e381b4](https://github.com/DiegoSmk/jsblock/commit/5e381b49431a021fe5a7bafc30b632b4a6a0d636))
* v0.6.0 polish - centralized IPC types, surgical workspace updates, and destructuring refinements ([69b7e72](https://github.com/DiegoSmk/jsblock/commit/69b7e721f86738d79de197f0d42945f147a6e5d9))


### 🐛 Bug Fixes

* **editor:** resolve duplicate keys and add missing reference handles ([920ed4b](https://github.com/DiegoSmk/jsblock/commit/920ed4baeb2354223e0952ca9c5665b349be2828))
* improve linux window resize behavior by adding padding grip ([1024523](https://github.com/DiegoSmk/jsblock/commit/1024523e804d6e4502000a96285433b1b080a825))
* **logic:** prevent macro-ref edge ID collisions and enable root-level scope ([1d48620](https://github.com/DiegoSmk/jsblock/commit/1d4862027296701d8a9f85ff72277b3c7d8f7379))
* **misc:** apply remaining minor fixes and type improvements ([38a3f4d](https://github.com/DiegoSmk/jsblock/commit/38a3f4d1daa9b3c3adaf8fba4d57963436396156))
* **parser:** support parsing of named export declarations ([7bdac0d](https://github.com/DiegoSmk/jsblock/commit/7bdac0dd5b17f15b5714668d67268b84c51bf552))
* remove review-diff.json and correct search limit units ([1d021a5](https://github.com/DiegoSmk/jsblock/commit/1d021a55098b617d604fdef333f7eaab451f68bc))
* resolve linting errors and type safety issues ([a0b32a6](https://github.com/DiegoSmk/jsblock/commit/a0b32a6895be2e39052ba6b6ce2d1d1dfa4d77fa))
* stabilize DiffEditor and improve global error filtering ([7148335](https://github.com/DiegoSmk/jsblock/commit/71483350967236b4735a7692cc3ead0d18a66e81))


### 🚀 Features

* Add Object Destructuring and Connection Validation ([879ce86](https://github.com/DiegoSmk/jsblock/commit/879ce86d5c98a2a686ecb590aa2f08a5432a7a7b))
* Add visual support for Async/Await ([fa5ac94](https://github.com/DiegoSmk/jsblock/commit/fa5ac94d5e5334b6c2703f2afe01d122270a57f4))
* **editor:** implement macro dependencies and cross-scope traceability ([f3196f4](https://github.com/DiegoSmk/jsblock/commit/f3196f426a8988a97a394e0a71d4e141db24b7e1))
* Implement Class Node support and Auto-Layout button ([ef1edd4](https://github.com/DiegoSmk/jsblock/commit/ef1edd408675af24b8c10d978ee6dda77a31933d))
* implement file renaming and robust workspace management ([b445092](https://github.com/DiegoSmk/jsblock/commit/b445092c403d968f36c7a5b7a04c944af5a1dd08))
* implement global search and replace ([8af2f02](https://github.com/DiegoSmk/jsblock/commit/8af2f027429364153946716df2e5eece51098035))
* Implement Quick Open (Ctrl+P) and File Breadcrumbs ([63823ac](https://github.com/DiegoSmk/jsblock/commit/63823ac5477e23f99dc8b2c177fccda9ad43b36a))
* improve performance, type safety and tests ([03755cb](https://github.com/DiegoSmk/jsblock/commit/03755cbf7130100b153600ebcb7c33dbab54d557))
* infrastructure for always-on-top pop-out windows and glassmorph UI components ([e96ae08](https://github.com/DiegoSmk/jsblock/commit/e96ae08fb9067ea63a812e70c82f51f4f7c4e270))
* memoize node filtering in FlowContent and improve execution store testability ([f9b67d3](https://github.com/DiegoSmk/jsblock/commit/f9b67d3b9cf527f1de389c75f67ab3031141b0a5))
* offload parsing and layout to web worker ([990c43c](https://github.com/DiegoSmk/jsblock/commit/990c43ce2e768a145d1d494019ccef5094171080))
* optimize worker performance, reliability and unify window payloads ([c181c07](https://github.com/DiegoSmk/jsblock/commit/c181c073c2f51a204b67c9a3669c733b85b59db7))
* optimized validation of recent environments using bulk IPC check ([4802413](https://github.com/DiegoSmk/jsblock/commit/48024133984515bfba5528febb538b5b09c2f416))
* **parser:** implement named and default export delegation in ExportHandler ([ca013ff](https://github.com/DiegoSmk/jsblock/commit/ca013ffbe0e4512d314041468f1367f2f296a19c))
* **parser:** implement named and default export parsing ([c6f63fb](https://github.com/DiegoSmk/jsblock/commit/c6f63fb1be5edca6093630a55b723e3f665241d9))
* **perf:** implement bulk file reading for project sync ([c3e3c56](https://github.com/DiegoSmk/jsblock/commit/c3e3c566fbd00d99c4af50f2f70e4be9108db848))
* **playground:** add comprehensive JS/TS test suite ([190e56e](https://github.com/DiegoSmk/jsblock/commit/190e56e593b4ac1cd5622c418fdd34b30a1faaca))
* refine export handling, add ExportNode, and implement UX improvements for v0.6.0 ([c8253ae](https://github.com/DiegoSmk/jsblock/commit/c8253aedbacbc93588277e8dee2eb0f82b6d7ff0))
* refine multi-window transparency and glassmorphism aesthetics ([2deb081](https://github.com/DiegoSmk/jsblock/commit/2deb0818156fd05a9476091962287058a4807c63))
* robust anonymous export support and handle collision prevention ([dec8e0d](https://github.com/DiegoSmk/jsblock/commit/dec8e0d2ebac77bc27ca97838207a416864ee8f5))
* **ui:** replace pop-out button with static beta badge ([26412cc](https://github.com/DiegoSmk/jsblock/commit/26412ccbd61de20cfeab2c3277d11d1063840581))
* **ui:** update beta badge to glass button style ([39e049a](https://github.com/DiegoSmk/jsblock/commit/39e049a218066eaf2693e0b37ff83835984b0bcd))
* v0.6.0 release - async/await support and polish ([9c1b651](https://github.com/DiegoSmk/jsblock/commit/9c1b651c56f577a270677f15fb23c163679584d4))

### [0.5.3](https://github.com/DiegoSmk/jsblock/compare/v0.5.2...v0.5.3) (2026-02-07)


### 🐛 Bug Fixes

* add write permissions for github release automation ([2648100](https://github.com/DiegoSmk/jsblock/commit/2648100df397af292fc9d21e67ad08976dea4374))

### [0.5.2](https://github.com/DiegoSmk/jsblock/compare/v0.5.1...v0.5.2) (2026-02-07)


### 🐛 Bug Fixes

* make build scripts cross-platform for windows runners ([5f7f832](https://github.com/DiegoSmk/jsblock/commit/5f7f8326909ec21f823f20e1cda13d5ed83bac6b))

### [0.5.1](https://github.com/DiegoSmk/jsblock/compare/v0.5.0...v0.5.1) (2026-02-07)


### 📚 Documentation

* add project roadmap towards v1.0.0 ([b0217b5](https://github.com/DiegoSmk/jsblock/commit/b0217b5f0fe8d09abed41036b681de4c82fdbd57))


### 🧹 Miscellaneous

* fix build author and complete electron-builder setup ([8a4163f](https://github.com/DiegoSmk/jsblock/commit/8a4163f20a0e37bd3b3a05ad0b1755a77822b0d3))
* **infra:** add standard-version configuration and release scripts ([6e9dbf9](https://github.com/DiegoSmk/jsblock/commit/6e9dbf9f8f26bebd49d331538765945b072faade))
* setup final icon and enable release automation ([0883eee](https://github.com/DiegoSmk/jsblock/commit/0883eee9880220f43f8b3b2714f19065e3750674))

## 0.5.0 (2026-02-07)


### 🎨 UI/UX

* **git:** implementa animações de entrada, correções de scroll e gráficos com gradientes ([f1152ef](https://github.com/DiegoSmk/jsblock/commit/f1152efd4ede328bc6ad9361c2207bd437571675))
* **git:** implementa responsividade e scrollarea no painel de informações ([7206b2c](https://github.com/DiegoSmk/jsblock/commit/7206b2c6ad2a11bfbe2dcb246af99cd38b1fcdcd))
* improve visibility of terminal and quick command scrollbars ([5ad7863](https://github.com/DiegoSmk/jsblock/commit/5ad786304fe968bfec32b9e67c2a4a61a53e16e9))
* limit sidebar panel maximum width ([73463a6](https://github.com/DiegoSmk/jsblock/commit/73463a642e34033173aae71901b5c9ba20f41775))
* refine git panel UI with responsive commit buttons and improved status headers ([a5c872c](https://github.com/DiegoSmk/jsblock/commit/a5c872c69a789ee3615ab6c713a91926ed487b71))


### ⚡ Performance

* implement buffered updates to eliminate flickering and fix simulation logic ([8be4f9a](https://github.com/DiegoSmk/jsblock/commit/8be4f9a54b05dd92f2602e812570cc2d436565e3))
* implement debounced live execution and disable by default ([40bc4ed](https://github.com/DiegoSmk/jsblock/commit/40bc4edb10ab958983f1178e33fb4315078ccbac))
* integrate elite change detection and v-sync buffered updates ([087624a](https://github.com/DiegoSmk/jsblock/commit/087624a17ba415044485a274e4c9776f961a9c80))
* Optimize App re-renders and stabilize Sidebar layout ([8738233](https://github.com/DiegoSmk/jsblock/commit/87382330e011d1af90b27c51c5796eea7f263da5))
* optimize control flow nodes with React.memo and fix dragging performance ([45b412b](https://github.com/DiegoSmk/jsblock/commit/45b412b96320c6d087c9a18feb5fe6bb9f048af8))


### 🚀 Features

* add extensions view and modularize sidebar/settings UI ([8bba8a0](https://github.com/DiegoSmk/jsblock/commit/8bba8a01f4b9de86197e1599e1fbaa2e09f3495b))
* add Git Information view to sidebar and set as default ([abb6c76](https://github.com/DiegoSmk/jsblock/commit/abb6c7669b514ec2dc33fc6a7ea178c70929d586))
* add MCP server for observation and agent skills ([ef74a17](https://github.com/DiegoSmk/jsblock/commit/ef74a17fb8289bb15d01514057311f647775dda8))
* Advanced styling for Note nodes and Edges ([b7b30d6](https://github.com/DiegoSmk/jsblock/commit/b7b30d65b771ae201da08ad3adc57b5142ca3b8a))
* **benchmark:** refine UI, add persistence, and real-time CPU monitoring ([90ed6d8](https://github.com/DiegoSmk/jsblock/commit/90ed6d825afc2e81de7b7017d748f1919d35799f))
* enhance live execution display with premium bubbles, icons, and toggle functionality ([86c6a32](https://github.com/DiegoSmk/jsblock/commit/86c6a3296f43df56aa917b959e7ac115ea91bdae))
* enhance store and logic for live execution tracking ([b64964e](https://github.com/DiegoSmk/jsblock/commit/b64964eed62aa438913eb15d76c4d17270cdc126))
* enhance terminal with header, system terminal button, and quick commands ([6853caa](https://github.com/DiegoSmk/jsblock/commit/6853caab862f775769625071b23ff297534593e1))
* **execution:** implement persistent runner and Quokka-like inline values ([08f3495](https://github.com/DiegoSmk/jsblock/commit/08f3495fec23685d0999a4ac71d5be47b2d379fd))
* expand quick fix suggestions to include function, return, and other keywords ([7538057](https://github.com/DiegoSmk/jsblock/commit/75380570ce961c25f31141dd567d24526d4e4914))
* **git:** add terminal progress bar, git suggestions, and undo commit functionality ([677a470](https://github.com/DiegoSmk/jsblock/commit/677a470216bad46026694e18720f6a3da0832efc))
* **git:** adiciona componentes de estado vazio e configuração do painel. ([72f3e6b](https://github.com/DiegoSmk/jsblock/commit/72f3e6ba0dc939908075123f0de21d334f05588b))
* **git:** Enhance Git Ignore UI, Terminal Prompts, and Commit History Visuals ([651c144](https://github.com/DiegoSmk/jsblock/commit/651c144661aeedbac7df85439e649dccff27274b))
* **git:** implement advanced stash management, dropdown list, and professional confirmation modals ([a7ea446](https://github.com/DiegoSmk/jsblock/commit/a7ea4466bb17e9fa812f59d4b38593a898ba4030))
* **git:** implement expanded commit editor and adapt templates ([9c33446](https://github.com/DiegoSmk/jsblock/commit/9c33446c882702d00de109a4ea60844c6817843b))
* **git:** implementa persistência de estado das seções e correções no gráfico de horários no GitInfoPanel ([c4371b9](https://github.com/DiegoSmk/jsblock/commit/c4371b96f28fb483be40af6e7b877cdb21e8de87))
* **git:** improve unstage logic, add batch operations and overhaul Git Panel UX ([a7111c9](https://github.com/DiegoSmk/jsblock/commit/a7111c93d9bef4b0e11264c511aa8c092014bf18))
* **git:** premium visual refinement for Git Graph and Commit History ([db3684a](https://github.com/DiegoSmk/jsblock/commit/db3684a63a26df97f41edfa9c4bc9d8689e3d480))
* **git:** refina painel de informações com estatísticas de tamanho, arquivos e gráficos de atividade ([aa7dbfe](https://github.com/DiegoSmk/jsblock/commit/aa7dbfebe88871d5d7460878effdaa847798829c))
* implement author modal with profile management, custom flags, and refined UI ([41c7e10](https://github.com/DiegoSmk/jsblock/commit/41c7e102fd414f927d2b6d1536d56e22cab7f5b6))
* implement clickable yellow suggestions and CTRL+ENTER quick fix ([ab27a91](https://github.com/DiegoSmk/jsblock/commit/ab27a91f0812db3ef9fa3dfc074e7c2824af06de))
* implement custom premium dropdown and fix loading issues ([22c4f69](https://github.com/DiegoSmk/jsblock/commit/22c4f693418bf3b099ce2847e8f599ad07e7e5a0))
* implement custom professional ScrollArea and integrate into GitPanel ([d3071ee](https://github.com/DiegoSmk/jsblock/commit/d3071ee8c8a420b56fd314146b6b0b51ad672a23))
* implement custom Radio component and refine AuthorModal layout ([8a07ddb](https://github.com/DiegoSmk/jsblock/commit/8a07ddbbd55928a9594c4744f687c880af4f5681))
* implement dual ribbon architecture and refactor git module ([4520913](https://github.com/DiegoSmk/jsblock/commit/4520913fc5310e033e59d864e5010f474a561862))
* implement dynamic Notes Library for .block files ([0d08a72](https://github.com/DiegoSmk/jsblock/commit/0d08a72c245db828a6f28888ea833efd875d2f4b))
* implement full-featured Git module with visual history, status, and smart initialization flow ([92f1757](https://github.com/DiegoSmk/jsblock/commit/92f17579b57d0770f242a185d9b372495814c442))
* implement instrumented execution engine with improved type safety ([7b3eb80](https://github.com/DiegoSmk/jsblock/commit/7b3eb800193623d2e03f3e6bdf4dd489e56b493f))
* implement integrated functional terminal using xterm.js and node-pty ([149a68f](https://github.com/DiegoSmk/jsblock/commit/149a68f5a07112db7a7ad1a8a968bc555542222e))
* implement interactive Quick Fix suggestions in Monaco editor ([41fcea6](https://github.com/DiegoSmk/jsblock/commit/41fcea68eec691efd74dab3502dd7a918ea91c43))
* implement logo easter egg and finalize premium modal UI ([28c323a](https://github.com/DiegoSmk/jsblock/commit/28c323a12ebf016ebd4b54f1570c402ab2dff1bb))
* implement notification system, relocate runtime selector to footer, and enhance UI aesthetics ([4eb497d](https://github.com/DiegoSmk/jsblock/commit/4eb497d0a8c5c895273e20402952de33bfd67663))
* implement plugin system foundation including IPC and store state ([c7bc1a6](https://github.com/DiegoSmk/jsblock/commit/c7bc1a60d1906e24064e1513c8269464fae35b40))
* implement professional splash screen with smart handshake and easter egg refinements ([bb6adc2](https://github.com/DiegoSmk/jsblock/commit/bb6adc22c84660dcca885834dc5c1462d245ddf8))
* implement recent environments, UI refinements, and performance optimizations ([9fa58a0](https://github.com/DiegoSmk/jsblock/commit/9fa58a0b2aba7ccfce7cd494ae58cd9e08554628))
* implement reusable Modal component and refactor Git modals ([72a1ec2](https://github.com/DiegoSmk/jsblock/commit/72a1ec28955ae1b5dba1c70b270600834ad43aad))
* implement Utility Nodes (Copy/Task) and refactor NoteNode into a modular structure ([f5f4694](https://github.com/DiegoSmk/jsblock/commit/f5f469470f5aeaa91ff97d2b22c372a6d77b5c5a))
* implement utility registry and enhance note node logic ([395884c](https://github.com/DiegoSmk/jsblock/commit/395884cd73a2732a44c4a4aeca18acf7b455f18b))
* implement visual flow connections, Bundler for WebWorkers and Quokka-like planning ([06c317c](https://github.com/DiegoSmk/jsblock/commit/06c317c695653d0e092b4f6d84c5da5c3a0eb8c1))
* improve edge style menu and fix Monaco CSP issues ([9f936c8](https://github.com/DiegoSmk/jsblock/commit/9f936c8c0a59a04939faf7e5d3dc568110e6e619))
* improve terminal stability and automation macros ([2003a38](https://github.com/DiegoSmk/jsblock/commit/2003a38adf3ac512be2a49a77945cd5d309d7ecc))
* Improve Tooltip component with dynamic positioning, overflow handling, and updated styling and animations. ([622b2db](https://github.com/DiegoSmk/jsblock/commit/622b2db2849cc2d1c6c230d4e2847e2eb29eabbf))
* initial project setup with Electron, React and Flow NoteNodes ([a0bbbbe](https://github.com/DiegoSmk/jsblock/commit/a0bbbbe3cce4bc647ffbebd9c653a35afe114a71))
* integrate theme settings, refine logo behavior, and standardize modal UI ([5fa1781](https://github.com/DiegoSmk/jsblock/commit/5fa1781ba171cc15f1c7595264a8530d3d051393))
* **qa:** complete Sprint 3 - State Decoupling, UI Modularization, and Multi-Runtime Smoke Tests ([d58e7bb](https://github.com/DiegoSmk/jsblock/commit/d58e7bbf98e0e5ddfa56e73a20a2f006610d55f1))
* refactor git navigation with graph view and dual sidebar modes ([002d8dd](https://github.com/DiegoSmk/jsblock/commit/002d8dd9d45a39da64b341bb4844bbc125bbf623))
* Refactor Git UI, fix sidebar resizing, and resolve linting errors ([1d8e65d](https://github.com/DiegoSmk/jsblock/commit/1d8e65d5d1bae8e2cc2f05749294300a2320520b))
* refine app layout, integrate recent environments into explorer and fix navigation constraints ([44c92b3](https://github.com/DiegoSmk/jsblock/commit/44c92b35642479b3a91363153383e7822eab2495))
* restore Developer settings tab and update debug report ([f91d79b](https://github.com/DiegoSmk/jsblock/commit/f91d79b687095212fa983463a727c2a3f91642e4))
* Setup Vitest and add unit tests for logic module ([e7b1a28](https://github.com/DiegoSmk/jsblock/commit/e7b1a28ee8bb647ed48a142cccc523567d57cf7a))
* stabilize footer UI by reserving space for running indicator ([0e9b0bd](https://github.com/DiegoSmk/jsblock/commit/0e9b0bd7ea8c92a79aa5847d3b1a98b1b4228429))
* standardize confirmation modals and improve note node connectivity/resizing UX ([ac1e136](https://github.com/DiegoSmk/jsblock/commit/ac1e1361680b6ba6a433415740d03e20f05a1ee1))
* **ui:** Refine UI aesthetics and fix layout inconsistencies ([f6a5082](https://github.com/DiegoSmk/jsblock/commit/f6a508242e1e64f4304cad7ae97562a40e55b6eb))


### 🐛 Bug Fixes

* clear error state immediately on new execution to prevent ghost suggestions ([5546cae](https://github.com/DiegoSmk/jsblock/commit/5546cae08d497109de544a44b4285682fedecab9))
* enforce reactive isolation rule and resolve 28 lint errors ([0438784](https://github.com/DiegoSmk/jsblock/commit/0438784c2d9714a761d925d65787b73e94816504))
* ensure deleted file is closed correctly with path normalization ([77be458](https://github.com/DiegoSmk/jsblock/commit/77be458e70df9b27fdf0e7e2eb01268f27a57b22))
* **execution:** implement robust cleanup of temporary files in ExecutionManager ([330bc0a](https://github.com/DiegoSmk/jsblock/commit/330bc0a1abc6b1d3430937cea8719f5fb1c85098))
* **execution:** resolve critical stability issues and unify benchmark logic ([0f04911](https://github.com/DiegoSmk/jsblock/commit/0f04911acd6819eb5e82d69180174f17fc981f7a))
* **execution:** resolve premature cleanup and TSX logic regressions ([a097274](https://github.com/DiegoSmk/jsblock/commit/a09727483e5cb7e45dddab9688b23797e0821df0))
* **explorer:** resolve lint warning and improve file deletion sync with path normalization ([192a36e](https://github.com/DiegoSmk/jsblock/commit/192a36eda4fd1d39820245563643714404445f35))
* implement instant syntax error clearing and improved transpilation signaling ([43fe48a](https://github.com/DiegoSmk/jsblock/commit/43fe48a66c439fd37a81306fff13de4ac17221a8))
* layout squashing, linter errors, and git responsiveness ([214877c](https://github.com/DiegoSmk/jsblock/commit/214877ca3b88c746595f32d101907f35409f0b64))
* NoteNode text input, task conversion, performance key issues, and lint cleanup ([b57c909](https://github.com/DiegoSmk/jsblock/commit/b57c90982e21e930236b4c0b543abf7239e327a2))
* **notes:** improve internal scrolling and scrollbar UX ([bad1dad](https://github.com/DiegoSmk/jsblock/commit/bad1dad5db41d610dd9e98fd5fbfca206401b6c5))
* remove duplicate electron.d.ts file ([8f9753a](https://github.com/DiegoSmk/jsblock/commit/8f9753a3fa7d4e784fa44c244da382b2fc0ba1b3))
* resolve all lint errors and enforce reactive isolation rule ([69ccfb1](https://github.com/DiegoSmk/jsblock/commit/69ccfb107760adb87b423db4a4beefeaad7ed4a6))
* resolve all lint issues ([3779118](https://github.com/DiegoSmk/jsblock/commit/37791183db0c7f9080dce3693d6c06322bad56f9))
* Resolve Allotment resize race condition ([37c6323](https://github.com/DiegoSmk/jsblock/commit/37c632309da83ff17547bb0b65f66ff90ab9c3cd))
* resolve false infinite loop detection by adding execution completion signaling ([823f606](https://github.com/DiegoSmk/jsblock/commit/823f6062e553e2336bc49c85c85e8f5e4f05b001))
* resolve FunctionCallNode.tsx lint issues ([3d6c1bf](https://github.com/DiegoSmk/jsblock/commit/3d6c1bfb7d099f2452aee668f81d778c2082004a))
* resolve lint issues in multiple components ([c7141fd](https://github.com/DiegoSmk/jsblock/commit/c7141fddb08c8075037870a8f7ae434dbfa9c821))
* resolve React Flow container error and cleanup utility node logic ([2326def](https://github.com/DiegoSmk/jsblock/commit/2326def4c7a2a8cf2db721194927f7e547f1b22d))
* resolve Tooltip.tsx lint issues ([3b66191](https://github.com/DiegoSmk/jsblock/commit/3b6619175fce33a3004fedeb343a717714bc825c))
* restore live syntax error feedback and improve execution stability ([512e6f2](https://github.com/DiegoSmk/jsblock/commit/512e6f2e4129dcf5db40d14f4988744a5aff9bf0))
* standardize execution error types and resolve lint issues ([f88874b](https://github.com/DiegoSmk/jsblock/commit/f88874b13d5ac6ddf5950faf05afc9220d74b6d0))
* trigger execution when live mode is toggled and prevent empty code timeouts ([699529e](https://github.com/DiegoSmk/jsblock/commit/699529e956596f55b37a7dfdbc7d7d39e58b0ecf))


### 🧹 Miscellaneous

* fix all remaining linting errors and warnings ([516f928](https://github.com/DiegoSmk/jsblock/commit/516f928f40dd1b784564308ff3cf9586da1ccc81))
* **infra:** final infrastructure polish and robustness ([a8d4eaa](https://github.com/DiegoSmk/jsblock/commit/a8d4eaa67bbb747573fa4d7ce966e9614cab8b90))
* lint cleanup and type refactoring across store and components ([75dbf58](https://github.com/DiegoSmk/jsblock/commit/75dbf58f1530e68a9dc3e5fa12358f5fed3f0adf))
* **lint:** implement professional type safety and zero-lint-error policy ([5e26717](https://github.com/DiegoSmk/jsblock/commit/5e2671703ed8240e8baa24ba21c5992ae50fc712))
* **qa:** finalize sprint 3.1 hardening and documentation ([e9df669](https://github.com/DiegoSmk/jsblock/commit/e9df669043213e9823e50104e87b67eb2723b38d))
* refactor main process and improve linting patterns ([5b40a8d](https://github.com/DiegoSmk/jsblock/commit/5b40a8d07c07a346442e50f557234520ff5f073e))
* resolve all remaining linting errors and refine UI components ([91ea7c2](https://github.com/DiegoSmk/jsblock/commit/91ea7c223f7a28a6391dace6a2c5f1e1866bfab3))


### 📚 Documentation

* add comprehensive technical documentation ([d9d7e4c](https://github.com/DiegoSmk/jsblock/commit/d9d7e4cc66fb61ae3f6f5f249eb9e7eb7a8e0154))
* add plugin system and system design documentation ([34c33ee](https://github.com/DiegoSmk/jsblock/commit/34c33eefdff8f2cc7a1df580d5f78043587bf0a5))
* add project README and fix: adjust connection handle hit area to 40px ([e9006db](https://github.com/DiegoSmk/jsblock/commit/e9006db26034530151763623bb182ee274b1da19))
* add refactoring plan for feature-based architecture ([ac7f5ba](https://github.com/DiegoSmk/jsblock/commit/ac7f5baca1b58165881a0485f78e0d24ccd9ddc6))
* add UI Architecture documentation ([81865d9](https://github.com/DiegoSmk/jsblock/commit/81865d9cd4ba4cbfe1507c88876bb3cf7a3c2423))
* finalize terminal and git slice documentation updates ([e7318f9](https://github.com/DiegoSmk/jsblock/commit/e7318f995ca68d479485b22b3c8b5b0cbdd0c01c))
* finalized workstation plan with architectural isolation requirements ([19dd150](https://github.com/DiegoSmk/jsblock/commit/19dd150f3892b95a55e17f7539391f3a10d996f9))
* Revamp README and add professional project banner ([b6d654c](https://github.com/DiegoSmk/jsblock/commit/b6d654c4f803cb59d3ed9c72885ea345aa4cf8a3))
* sync architecture and readme with multi-runtime & mcp infrastructure ([a4fc910](https://github.com/DiegoSmk/jsblock/commit/a4fc910e54d676a5d90f71ada007118a79540898))
