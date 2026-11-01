# refresh-context

`/refresh-context`: fresh context, same task.

1. Agent writes a handoff.
2. `/clear` runs.
3. Agent resumes from the handoff.

Optional notes: `/refresh-context remember the rate limit`

## Install

```
claude plugin install refresh-context --marketplace Great-Grand-Software/refresh-context
```

## Develop

```
claude plugin test .
claude --plugin-dir .
```
