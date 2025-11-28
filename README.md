# ShopSmart

ShopSmart is a lightweight ecommerce experience built entirely with vanilla HTML, CSS, and JavaScript. It showcases a curated catalog, interactive filtering, and a responsive cart drawer without any build tooling or external frameworks.

## Features

- Responsive hero, collection highlights, and catalog grid tuned for modern retail layouts
- Dynamic filters for category, price, search, tag chips, and multiple sort orders
- Client-side cart drawer with quantity controls, subtotal calculation, and persistence for the session
- Accessible markup leveraging semantic HTML, ARIA attributes, and focus-safe controls
- Modern light/dark theme toggle that remembers each visitor's preference and mirrors OS settings
- Zero external dependencies so it can ship as static assets to any host

## Project Structure

```text
.
|-- index.html          # Main page shell and component templates
|-- styles/main.css     # Global tokens, layout, product grid, and cart styling
|-- scripts/app.js      # Catalog rendering, filtering logic, and cart behavior
|-- data/products.js    # Mock product feed consumed by the app
`-- assets/images/      # Placeholder for future imagery
```

## Running Locally

No build step is required. Use any static file server and open `index.html` in a browser:

```bash
# Option 1: Python 3
python -m http.server 8080

# Option 2: npm serve (install once globally)
npx serve .
```

Then visit `http://localhost:8080` (or the port shown by your server).

## License MIT License. See `LICENSE` file for details.

MIT License. See `LICENSE` file for details.