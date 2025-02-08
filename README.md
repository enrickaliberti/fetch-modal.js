# 🚀 FetchModal & TemplateEngine  

FetchModal is a lightweight JavaScript library that enables **dynamic content fetching** and **template rendering** inside a modal. It supports both **HTML sections** and **JSON APIs**, allowing for real-time content updates without reloading the page.  

## ✨ Features  

✅ **Fetch and display sections from other pages**  
✅ **Support for API requests with automatic JSON recognition**  
✅ **Built-in template engine with `if` conditions and `foreach` loops**  
✅ **Smart caching to avoid redundant network requests**  
✅ **Navigation history tracking (Back button support)**  
✅ **Smooth animations and modal transitions**  

---

## 📦 Installation  

Simply include the script in your project:  

```html
<script src="fetch-modal.js"></script>
```

or use it as a module:

`import FetchModal from "./fetch-modal.js";`

## 🔥 Usage
### 1️⃣ Load a specific section from another page
You can fetch a part of another page (instead of reloading everything) by adding the data-fetch-modal attribute:

`<a href="page.html" data-fetch-modal data-target="section-id">Open Section</a>`

- When the user clicks the link, FetchModal retrieves the #section-id content from page.html and displays it in a modal.
- This reduces unnecessary page loads and enhances UX.

### 2️⃣ Fetch JSON data and use templating
FetchModal detects if the response is in JSON format and dynamically renders the content using the *TemplateEngine*.

*Example: API Response*
Assume an API endpoint (`/api/products`) returns:

```json
{
  "products": [
    { "name": "Laptop", "price": 1200 },
    { "name": "Phone", "price": 800 }
  ]
}
```

*HTML TEMPLATE*

```html
<a href="/api/products" data-fetch-modal data-target="product-list">View Products</a>

<!-- This template will be used inside the modal -->
<div id="product-list" style="display: none;">
  <ul>
    {foreach products as product}
      <li>{product.name} - ${product.price}</li>
    {/foreach}
  </ul>
</div>
```

*📌 How it works:*

1. FetchModal recognizes the JSON response and passes the data to `TemplateEngine`.
2. The {foreach} loop dynamically generates the product list.
3. The rendered content is displayed inside the modal.

## ⚙️ Advanced Features
## 🔄 History & Back Button Support
Each fetched content is saved in history (`window.history.pushState`).
Clicking "Back" in the browser restores the previous modal.
## 🚀 Smart Caching
FetchModal caches fetched content to improve performance.
Avoids unnecessary requests when the same content is loaded again.
## 🎨 Customization
You can style the modal using CSS or override default styles by modifying fetch-modal.css.

## 📜 License
This project is open-source and available under the MIT License.
