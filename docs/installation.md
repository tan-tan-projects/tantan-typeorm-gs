## Installation

### Requirements

Before installing `tantan-typeorm-gs`, make sure your project has:

- Node.js or Bun
- TypeScript
- TypeORM `1.1.x`

The driver is distributed as an npm package and uses TypeORM as its ORM layer.

### Install

Using npm:

```bash
npm install tantan-typeorm-gs typeorm googleapis
```

Using Bun:

```bash
bun add tantan-typeorm-gs typeorm googleapis
```

### TypeScript

The project using the driver should have TypeScript configured.

For example:

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "Bundler"
	}
}
```

### Verify Installation

After installation, the package can be imported from the application:

```ts
import { createGoogleSheetsDataSource } from "tantan-typeorm-gs";
```

The next step is configuring Google Cloud and Google Sheets API access.
