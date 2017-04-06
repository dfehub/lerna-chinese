import dedent from "dedent";
import path from "path";

// mocked modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";

// file under test
import ConventionalCommitUtilities from "../src/ConventionalCommitUtilities";

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

describe("ConventionalCommitUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".recommendVersion()", () => {
    it("should invoke conventional-changelog-recommended bump to fetch next version", () => {
      ChildProcessUtilities.execSync = jest.fn(() => "major");

      const recommendVersion = ConventionalCommitUtilities.recommendVersion({
        name: "bar",
        version: "1.0.0",
        location: "/foo/bar",
      });

      expect(recommendVersion).toBe("2.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        `${require.resolve("conventional-recommended-bump/cli.js")} -l bar --commit-path=/foo/bar -p angular`,
      );
    });
  });

  describe(".updateChangelog()", () => {
    it("should populate initial CHANGELOG.md if it does not exist", () => {
      FileSystemUtilities.existsSync = jest.fn(() => false);
      ChildProcessUtilities.execSync = jest.fn(() => "<a name='change' />feat: I should be placed in the CHANGELOG");

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar"
      });

      expect(FileSystemUtilities.existsSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md")
      );
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        `${require.resolve("conventional-changelog-cli/cli.js")} -l bar --commit-path=/foo/bar --pkg=${path.normalize("/foo/bar/package.json")} -p angular`,
      );
      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

          <a name='change' />feat: I should be placed in the CHANGELOG
        `
      );
    });

    it("should insert into existing CHANGELOG.md", () => {
      FileSystemUtilities.existsSync = jest.fn(() => true);
      ChildProcessUtilities.execSync = jest.fn(() => "<a name='change2' />fix: a second commit for our CHANGELOG");
      FileSystemUtilities.readFileSync = jest.fn(() => dedent`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

        <a name='change' />feat: I should be placed in the CHANGELOG
      `);

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar/",
      });

      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

          <a name='change2' />fix: a second commit for our CHANGELOG

          <a name='change' />feat: I should be placed in the CHANGELOG
        `
      );
    });
  });
});