# refresh-context

Clear Claude Code's context without losing your place.

```
/refresh-context
```

1. **First:** Claude writes a handoff for its current task.
2. **Next:** the context clears.
3. **Finally:** Claude reads the handoff and keeps working.

Optional notes: `/refresh-context remember the rate limit`

## Install

```
claude plugin install refresh-context --marketplace Great-Grand-Software/refresh-context
```

## Test

```
claude plugin test .
```
