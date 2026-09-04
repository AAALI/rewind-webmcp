# Submission readiness review

Reviewed September 4, 2026. Result: **close — not ready for final submission**.

## Official requirements and status

Live Devpost connector responses supplied requirements, rules, judging criteria, dates, announcements, registration relationship, and project status.

- The account is registered for The WebMCP Challenge.
- Its only project in that challenge is project 1405596: Untitled, `submission_pre_draft`, empty description, no video, and no `submitted_at` timestamp.
- The supplied management link is https://devpost.com/submit-to/31011-the-webmcp-challenge/manage/submissions/1159129/project-overview. After the author logged in, this exact management URL displayed Rewind and linked to https://devpost.com/software/rewind-01wez3, confirming it is the intended project.
- Live structured deadline: September 4, 2026, 08:00 UTC / 12:00 Dubai. The host's September 3 announcement, “Deadline Extension | 12 more hours,” confirms 1:00 am PT September 4. The rules page's original September 3 deadline predates that extension.
- Required deliverables: functioning live WebMCP app; explanation of fit, user experience, human/agent collaboration and implementation; public source with detectable open-source license; public YouTube demo below three minutes with spoken audio; required custom-question answers.
- Judging criteria: WebMCP Leverage, Execution, Potential Impact, Creativity & Ambition.

Sources: https://webmcp.devpost.com/ and https://webmcp.devpost.com/rules, read through Devpost's connector. Official host announcement also says: “Do not edit your repo, your video, or your live site” after the deadline. Keep the judged materials available through the judging period.

## Verified

| Check | Evidence |
| --- | --- |
| Public source and license | Unauthenticated GitHub API response: public repository; MIT license detected. |
| Live storefront | Opens without a shop login in Codex's in-app browser. |
| WebMCP registration | 12 tools discovered: 10 store tools plus history and restore. |
| Tool execution | Live catalog search, cart mutation/read, history, and restore executed through the browser's WebMCP bridge. |
| AI planner | Built-in live assistant returned the $57 VistaMesh Tee for the black-products-under-$80 prompt. |
| Restore and retry | Local corrected UI restored state, exposed Undo again after an external-agent retry, and retained both attempts on separate branches. |
| Persistence | Local reload retained the root head and both historical commits. |
| Tests | 16 tests passed: SDK commits/restore/branching/discovery and cart-validation regressions. |
| Production build | SDK, hosted bundles, TypeScript, and Vite build passed. |
| SDK distribution | Hosted ESM bundle returns HTTP 200. npm registry returns 404 for the claimed package; documentation corrected locally. |
| Secret scan | No matching secrets in tracked source. Local `.env` exists, is ignored, and is not tracked; its contents were not displayed. This is not a Git-history audit or full security assessment. |

## Fixes prepared locally

1. Recovery banner was a sticky boolean: after Undo, external agent changes continued to show “Cart restored” and hid Undo. It now refers to the restored commit head, so a new commit exposes Undo again.
2. Undo selected the last commit in the complete history, regardless of the active branch. It now restores the parent of the current head.
3. Cart mutation silently cleared carts on missing input, dropped unknown products, and accepted non-finite or fractional quantities. Invalid requests now fail without changing the cart or history; duplicate product/size lines and unsupported sizes are rejected.
4. The cart claimed the shopper had a $200 budget from seed data even though the interface never collected a budget. That assertion was removed. The landing preview now shows a clearly labeled, consistent recovery example.
5. README and landing page advertised an unpublished npm package, and the source link used the wrong GitHub owner. They now point to the real source and available ESM distribution.
6. Smart-search planner failures were hidden behind the search modal. Errors now appear in the normal result surface.
7. Browser guidance now matches the event's Chrome 149+ guidance. README distinguishes Vite-only development from running the AI backend, and includes judge instructions. Checkout explicitly identifies itself as a non-transactional demo.

## Remaining actions before submitting

- Publish the reviewed source changes and deploy the corrected site, then verify the production retry/Undo behavior and final links.
- Review the saved Devpost draft at https://devpost.com/software/rewind-01wez3. Title, tagline, description, technologies, links, live URL, judge instructions, tested-client answer, and AI-tools answer have been saved and verified in the exact submission form. The required video and personal answers remain missing.
- Record/upload the required public YouTube video using `docs/demo-video-script.md`; verify its duration, audio, visibility, and matching app behavior.
- Author must answer submitter type, country/countries of residence, new/existing status, learning level, and AI career value. Add any earlier AI tooling details.
- Confirm rules and eligibility, including third-party asset/branding permissions and team membership where applicable. This review did not record agreement on the author's behalf.
- Choose/capture project thumbnail and screenshots; none were uploaded during this review.
- Give explicit final-submit confirmation only after all required fields and deliverables are ready. Verify the resulting submission live afterward.

## Scope limits

Chrome and the ChatGPT desktop browser were not separately tested; report the actual tested client as Codex's in-app browser. The public endpoint has no application-level rate limiting. Local history is mutable browser storage, not a secure audit log, and the SDK does not compensate real external Shopify operations. The code fixes and report are local and uncommitted. The Devpost project was subsequently populated with title, tagline, description, technologies, and links and read back successfully: https://devpost.com/software/rewind-01wez3. No deployment or final submission occurred.
