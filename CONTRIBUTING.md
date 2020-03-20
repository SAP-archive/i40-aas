# Contributing to i40-aas

You want to contribute to _i40-aas_? Welcome! Please read this document to understand what you can do:

- [Contributing to i40-aas](#contributing-to-i40-aas)
  - [Analyze Issues](#analyze-issues)
  - [Issue Handling Process](#issue-handling-process)
  - [Contribute Code](#contribute-code)
  - [Reporting Security Issues](#reporting-security-issues)
  - [Contributor License Agreement Acceptance](#contributor-license-agreement-acceptance)
    - [Company Contributors](#company-contributors)

## Analyze Issues

Analyzing issue reports can be a lot of effort. Any help is welcome!
Go to [the Github issue tracker](https://github.com/SAP/i40-aas/issues?state=open) and find an open issue which needs additional work or a bugfix. Maybe you can even find and [contribute](#contribute-code) a bugfix?

## Issue Handling Process

When an issue is reported, a committer will look at it and either confirm it as a real issue (by giving the "approved" label), close it if it is not an issue, or ask for more details. Approved issues are then either assigned to a committer in GitHub, reported in our internal issue handling system, or left open as "contribution welcome" for easy or not urgent fixes. An issue that is about a real bug is closed as soon as the fix is committed.

## Contribute Code

You are welcome to contribute code to _i40-aas_ in order to fix bugs or to implement new features.

We are using [editorconfig](https://editorconfig.org/) in combination with [eclint](https://www.npmjs.com/package/eclint) to format our src files. If you want to contribute code, please install an editorconfig.org plugin for your IDE or run [eclint](https://github.com/jedmao/eclint#fix) fix for all of your changed files.

install the clt

```
npm i eclint -g
```

navigate to the root folder of i40-aas

```
cd <path to projects root folder>
```

[check](https://github.com/jedmao/eclint#check) that you only format your files

```
eclint check '<path to your changed files>'

//e.g. eclint check 'src/ts/cmd/onboarding-skill/**/*.ts'


```

[fix](https://github.com/jedmao/eclint#fix) your changed files

```
eclint fix '<path to your file>'

// e.g. eclint fix 'src/ts/cmd/onboarding-skill/src/server.ts' for a specific src file
// or eclint fix 'src/ts/cmd/onboarding-skill/**/*.ts' for all src files in this folder

```

## Reporting Security Issues

If you find a security issue, please act responsibly and report it not in the public issue tracker, but directly to us, so we can fix it before it can be exploited.

## Contributor License Agreement Acceptance

When you contribute (code, documentation, or anything else), you have to be aware that your contribution is covered by the same [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0) that is applied to i40-aas itself.
In particular you need to agree to the Individual Contributor License Agreement,
which can be [found here](https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8).
(This applies to all contributors, including those contributing on behalf of a company). If you agree to its content, you simply have to click on the link posted by the CLA assistant as a comment to the pull request. Click it to check the CLA, then accept it on the following screen if you agree to it. CLA assistant will save this decision for upcoming contributions and will notify you if there is any change to the CLA in the meantime.

### Company Contributors

If employees of a company contribute code, in **addition** to the individual agreement mentioned above, one company agreement must be submitted. This is mainly for the protection of the contributing employees.

A company representative authorized to do so needs to download, fill in, and print the [Corporate Contributor License Agreement](/docs/SAP/SAP%20CCLA.pdf) form and then proceed with one of the following options:

- Scan and e-mail it to [opensource@sap.com](mailto:opensource@sap.com)
- Fax it to: +49 6227 78-45813
- Send it by traditional letter to:
  _OSPO Core_
  _Dietmar-Hopp-Allee 16_
  _69190 Walldorf_
  _Germany_

The form contains a list of employees who are authorized to contribute on behalf of your company. When this list changes, please let us know.
