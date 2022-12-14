"use strict";

const path = require("path");

const { cliRunner } = require("@lerna-test/helpers");
const cloneFixture = require("@lerna-test/helpers").cloneFixtureFactory(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

test("lerna publish sets correct exit code when libnpmpublish fails", async () => {
  const { cwd } = await cloneFixture("normal");

  await expect(
    cliRunner(cwd)("publish", "patch", "--yes", "--no-verify-access", "--loglevel", "error")
  ).rejects.toThrow(
    expect.objectContaining({
      stderr: expect.stringContaining("E404 Not found"),
      exitCode: 1,
    })
  );
});
