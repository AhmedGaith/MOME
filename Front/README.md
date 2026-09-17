# MOME — Clothing Brand Website

A simple, ready-to-use website for the MOME clothing brand. No build step required — open `index.html` in a browser or serve the folder with any static file server.

## Pages & Features

| Feature | Description |
|---------|-------------|
| **Home** | Hero banner with brand messaging |
| **Shop** | Product grid with category filters |
| **Search** | Search bar in header and shop section (by name, category, description) |
| **About** | Brand story section |
| **Contact** | Contact info + message form |
| **Admin** | Hidden inventory panel to add, edit, and delete products |

## Getting Started

1. Open `index.html` in your browser, or run a local server:

   ```bash
   npx serve .
   ```

2. Browse the shop, search products, and use the contact form.

## Admin Panel (Hidden URL)

The admin panel is **not linked** from the public site. Access it directly at:

```
vault/mome-inventory-x7k2.html
```

**Default password:** `mome2026`

Change the password in `js/admin.js` (line 1: `ADMIN_PASSWORD`).

### Admin capabilities

- Add new products (name, category, description, price, sizes, **upload image** or paste URL)
- Edit existing products
- Delete products
- Changes appear instantly on the main shop page (same browser)

Products are stored in the browser's **localStorage**, so they persist between visits on the same device/browser.

## File Structure

```
MOME/
├── index.html              # Main storefront
├── css/
│   ├── styles.css          # Store styles
│   └── admin.css           # Admin panel styles
├── js/
│   ├── products.js         # Product data & localStorage
│   ├── app.js              # Storefront logic
│   └── admin.js            # Admin panel logic
├── vault/
│   └── mome-inventory-x7k2.html   # Hidden admin URL
└── README.md
```

## Customization

- **Brand name / copy:** Edit text in `index.html`
- **Contact details:** Update the Contact section in `index.html`
- **Default products:** Edit `DEFAULT_PRODUCTS` in `js/products.js`
- **Colors & fonts:** Adjust CSS variables at the top of `css/styles.css`
- **Admin password:** Change `ADMIN_PASSWORD` in `js/admin.js`
- **Hidden admin path:** Rename `vault/mome-inventory-x7k2.html` to any path you prefer

## Notes

- Product images can be **uploaded directly** in the admin panel (stored in the browser) or linked via URL.
- The contact form shows a success message locally — connect it to a backend or service (e.g. Formspree) for real email delivery.
- For production, consider hosting on Netlify, Vercel, or GitHub Pages.
