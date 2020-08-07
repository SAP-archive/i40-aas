# Contributing to i40-aas

You want to contribute to _i40-aas_? Welcome! Please read this document to understand what you can do:

- [Contributing to i40-aas](#contributing-to-i40-aas)
  - [Analyze Issues](#analyze-issues)
  - [Issue Handling Process](#issue-handling-process)
  - [Contribute Code](#contribute-code)
  - [Reporting Security Issues](#reporting-security-issues)
  - [Developer Certificate of Origin (DCO)](#developer-certificate-of-origin-dco)

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

## Developer Certificate of Origin (DCO)

Due to legal reasons, contributors will be asked to accept a DCO before they submit the first pull request to this projects, this happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).
