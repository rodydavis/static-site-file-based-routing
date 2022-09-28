# Static Site File Based Routing

[![Demo](https://github.com/rodydavis/static-site-file-based-routing/actions/workflows/demo.yml/badge.svg)](https://github.com/rodydavis/static-site-file-based-routing/actions/workflows/demo.yml)

This is a simple example of how to render a MPA with file based routing and includes a build and watch mode.

## Features

- Incremental builds
- Watch mode
- Build mode
- Static folders
- HTML and Markdown support
- Nested Layouts
- File based routing
- Syntax highlighting
- Github Actions
- [Web Dev Server](https://modern-web.dev/docs/dev-server)

## Getting Started

Build TS files:

```bash
npm i
```

Start the watch mode on the html files:

```bash
npm run dev
```

or one time build:

```bash
npm run build
```

Start the http server:

```bash
npm run start
```

Open the browser to http://127.0.0.1:8080/static-site-file-based-routing/

## Creating a new page

Create a new page in the target folder that is named `index` and is a markdown or html file:

`example/about/index.md`

```markdown
# About Page

This is the about page.
```

`example/index.html`

```html
<h1>Home Page</h1>
```

## Creating a new layout

Create a new layout in the target folder that is named `layout` and is a html file:

`example/about/layout.html`

```html
<html>
  <head>
    <title>About Page</title>
  </head>
  <body>
    <h1>About Page</h1>
    <div class="content">
      <slot></slot>
    </div>
  </body>
</html>
```

If a `<slot>` is added it will replace the content with the child pages in the directory, otherwise it will append to the end of the body.

### Nested Layouts

The layout chain will be the following for the given route `/about/`:

1. `example/about/index.html`
2. `example/about/layout.html`
3. `example/layout.html`

## CSS and JS

Any css or js files in the target folder will be copied to the build folder.

## Assets

Any assets in the `public` folder will be copied to the build folder.

There is an option to pass multiple directories to the `public` option.
