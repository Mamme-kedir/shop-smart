(function initShop() {
    const products = Array.isArray(window.PRODUCT_DATA) ? window.PRODUCT_DATA : [];
    const STAR = "\u2605";
    const THEME_STORAGE_KEY = "shopsmart-theme";
    const state = {
        category: "all",
        tag: "all",
        searchText: "",
        sort: "featured",
        maxPrice: getMaxPrice(products),
        selectedPrice: getMaxPrice(products)
    };

    const cart = new Map();
    const els = bindElements();
    const docRoot = document.documentElement;

    initializeTheme();
    if (!els.grid) {
        console.warn("Product grid not found; aborting setup");
        return;
    }

    hydrateControls();
    renderTagChips();
    renderProducts();
    updateCartUI();

    /* -------- helpers -------- */
    function bindElements() {
        return {
            grid: document.getElementById("product-grid"),
            empty: document.getElementById("empty-state"),
            category: document.getElementById("category-filter"),
            priceRange: document.getElementById("price-range"),
            priceValue: document.getElementById("price-value"),
            sort: document.getElementById("sort-by"),
            search: document.getElementById("search-input"),
            reset: document.getElementById("filters-reset"),
            chips: document.getElementById("tag-chips"),
            template: document.getElementById("product-card-template"),
            chipTemplate: document.createElement("button"),
            themeToggle: document.getElementById("theme-toggle"),
            cartDrawer: document.getElementById("cart-drawer"),
            cartToggle: document.getElementById("cart-toggle"),
            cartClose: document.getElementById("cart-close"),
            cartScrim: document.getElementById("cart-scrim"),
            cartCount: document.getElementById("cart-count"),
            cartItemCount: document.getElementById("cart-item-count"),
            cartItems: document.getElementById("cart-items"),
            cartEmpty: document.getElementById("cart-empty-msg"),
            cartTotal: document.getElementById("cart-total"),
            cartItemTemplate: document.getElementById("cart-item-template"),
            checkout: document.getElementById("checkout"),
            heroCta: document.getElementById("shop-now"),
            bestSellers: document.getElementById("view-best-sellers"),
            catalogSection: document.getElementById("catalog")
        };
    }

    function hydrateControls() {
        populateCategories();
        if (els.priceRange) {
            els.priceRange.max = String(state.maxPrice);
            els.priceRange.value = String(state.selectedPrice);
        }
        updatePriceDisplay();
        attachFilterEvents();
        attachCartEvents();
        attachHeroShortcuts();
    }

    function populateCategories() {
        if (!els.category) return;
        const unique = Array.from(new Set(products.map((p) => p.category))).sort();
        unique.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            els.category.appendChild(option);
        });
    }

    function attachFilterEvents() {
        if (els.category) {
            els.category.addEventListener("change", (event) => {
                state.category = event.target.value;
                renderProducts();
            });
        }

        if (els.priceRange) {
            els.priceRange.addEventListener("input", (event) => {
                state.selectedPrice = Number(event.target.value);
                updatePriceDisplay();
                renderProducts();
            });
        }

        if (els.sort) {
            els.sort.addEventListener("change", (event) => {
                state.sort = event.target.value;
                renderProducts();
            });
        }

        if (els.search) {
            els.search.addEventListener("input", (event) => {
                state.searchText = event.target.value.trim().toLowerCase();
                renderProducts();
            });
        }

        if (els.reset) {
            els.reset.addEventListener("click", () => {
                state.category = "all";
                state.tag = "all";
                state.searchText = "";
                state.sort = "featured";
                state.selectedPrice = state.maxPrice;
                if (els.category) els.category.value = "all";
                if (els.sort) els.sort.value = "featured";
                if (els.search) els.search.value = "";
                if (els.priceRange) els.priceRange.value = String(state.maxPrice);
                updatePriceDisplay();
                renderTagChips();
                renderProducts();
            });
        }
    }

    function attachCartEvents() {
        const closeCart = () => toggleCart(false);

        els.cartToggle?.addEventListener("click", () => {
            const next = !isCartOpen();
            toggleCart(next);
        });

        els.cartClose?.addEventListener("click", closeCart);
        els.cartScrim?.addEventListener("click", closeCart);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isCartOpen()) {
                closeCart();
            }
        });

        els.checkout?.addEventListener("click", () => {
            alert("Checkout flow coming soon.");
        });

        function toggleCart(open) {
            if (!els.cartDrawer) return;
            els.cartDrawer.dataset.open = String(open);
            els.cartDrawer.setAttribute("aria-hidden", String(!open));
            els.cartToggle?.setAttribute("aria-expanded", String(open));
            if (els.cartScrim) {
                els.cartScrim.hidden = !open;
            }
        }

        function isCartOpen() {
            return els.cartDrawer?.dataset.open === "true";
        }
    }

    function attachHeroShortcuts() {
        const scrollToCatalog = () => els.catalogSection?.scrollIntoView({ behavior: "smooth" });
        els.heroCta?.addEventListener("click", scrollToCatalog);
        els.bestSellers?.addEventListener("click", () => {
            state.sort = "rating";
            if (els.sort) {
                els.sort.value = "rating";
            }
            renderProducts();
            scrollToCatalog();
        });
    }

    function renderTagChips() {
        if (!els.chips) return;
        els.chips.textContent = "";
        const tags = new Set();
        products.forEach((product) => product.tags.forEach((tag) => tags.add(tag)));
        const ordered = ["all", ...Array.from(tags).sort()];
        ordered.forEach((tag) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "chip";
            chip.textContent = tag === "all" ? "All tags" : tag;
            chip.dataset.tag = tag;
            chip.setAttribute("aria-pressed", state.tag === tag ? "true" : "false");
            if (state.tag === tag) chip.classList.add("active");
            chip.addEventListener("click", () => {
                state.tag = tag;
                renderTagChips();
                renderProducts();
            });
            els.chips.appendChild(chip);
        });
    }

    function renderProducts() {
        if (!els.grid || !els.template?.content) return;
        els.grid.textContent = "";
        const filtered = applyFilters(products);
        if (!filtered.length) {
            els.empty?.removeAttribute("hidden");
            return;
        }
        els.empty?.setAttribute("hidden", "true");

        filtered.forEach((product) => {
            const fragment = els.template.content.cloneNode(true);
            const card = fragment.querySelector(".product-card");
            const media = fragment.querySelector(".product-media");
            const category = fragment.querySelector(".product-category");
            const rating = fragment.querySelector(".product-rating");
            const title = fragment.querySelector(".product-title");
            const desc = fragment.querySelector(".product-desc");
            const price = fragment.querySelector(".product-price");
            const addBtn = fragment.querySelector(".add-to-cart");
            const newBadge = fragment.querySelector(".badge-new");
            const lowBadge = fragment.querySelector(".badge-low");

            media.style.setProperty("background", product.accent || "var(--surface-alt)");
            category.textContent = product.category;
            rating.textContent = `${product.rating.toFixed(1)} ${STAR}`;
            title.textContent = product.name;
            desc.textContent = product.description;
            price.textContent = formatCurrency(product.price);

            if (product.isNew) newBadge.hidden = false;
            if (product.stock <= 5) {
                lowBadge.hidden = false;
                lowBadge.textContent = "Low stock";
            }

            addBtn?.addEventListener("click", () => addToCart(product.id));
            card.dataset.productId = product.id;
            els.grid.appendChild(fragment);
        });
    }

    function applyFilters(list) {
        const text = state.searchText;
        return list
            .filter((product) => state.category === "all" || product.category === state.category)
            .filter((product) => state.tag === "all" || product.tags.includes(state.tag))
            .filter((product) => product.price <= state.selectedPrice)
            .filter((product) => {
                if (!text) return true;
                const haystack = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
                return haystack.includes(text);
            })
            .sort(sorter(state.sort));
    }

    function sorter(mode) {
        const collators = {
            featured: (a, b) => Number(b.isNew) - Number(a.isNew),
            "price-asc": (a, b) => a.price - b.price,
            "price-desc": (a, b) => b.price - a.price,
            rating: (a, b) => b.rating - a.rating,
            new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        };
        return collators[mode] ?? collators.featured;
    }

    function addToCart(productId) {
        const product = products.find((item) => item.id === productId);
        if (!product) return;
        const existing = cart.get(productId) ?? { product, quantity: 0 };
        existing.quantity = Math.min(existing.quantity + 1, 10);
        cart.set(productId, existing);
        updateCartUI();
    }

    function updateCartUI() {
        if (!els.cartItems || !els.cartItemTemplate?.content) return;
        els.cartItems.textContent = "";
        let total = 0;
        let itemCount = 0;

        cart.forEach(({ product, quantity }) => {
            const fragment = els.cartItemTemplate.content.cloneNode(true);
            fragment.querySelector(".cart-item-title").textContent = product.name;
            fragment.querySelector(".cart-item-meta").textContent = formatCurrency(product.price);
            const qtyInput = fragment.querySelector(".cart-item-qty");
            qtyInput.value = String(quantity);
            qtyInput.addEventListener("change", (event) => {
                const nextValue = Math.max(1, Math.min(10, Number(event.target.value)));
                event.target.value = String(nextValue);
                cart.set(product.id, { product, quantity: nextValue });
                updateCartUI();
            });
            fragment.querySelector(".cart-item-remove").addEventListener("click", () => {
                cart.delete(product.id);
                updateCartUI();
            });
            els.cartItems.appendChild(fragment);
            total += product.price * quantity;
            itemCount += quantity;
        });

        const hasItems = cart.size > 0;
        if (els.cartEmpty) {
            els.cartEmpty.hidden = hasItems;
        }
        if (els.cartTotal) {
            els.cartTotal.textContent = formatCurrency(total);
        }
        if (els.cartCount) {
            els.cartCount.textContent = String(itemCount);
        }
        if (els.cartItemCount) {
            els.cartItemCount.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
        }
    }

    function updatePriceDisplay() {
        if (els.priceValue) {
            els.priceValue.textContent = formatCurrency(state.selectedPrice);
        }
    }

    function getMaxPrice(list) {
        const max = Math.max(...list.map((product) => product.price), 100);
        return Math.ceil(max / 10) * 10;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(value);
    }

    function initializeTheme() {
        if (!docRoot) return;
        const toggle = els.themeToggle;
        const stored = readStoredTheme();
        const prefersDarkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
        const initial = stored ?? (prefersDarkQuery?.matches ? "dark" : "light");
        applyTheme(initial, false);

        if (toggle) {
            toggle.addEventListener("click", () => {
                const next = docRoot.dataset.theme === "dark" ? "light" : "dark";
                applyTheme(next, true);
            });
        }

        const handleSystemChange = (event) => {
            if (readStoredTheme()) return;
            applyTheme(event.matches ? "dark" : "light", false);
        };

        subscribeToPreference(prefersDarkQuery, handleSystemChange);
    }

    function applyTheme(theme, persist = true) {
        if (!docRoot) return;
        const normalized = normalizeTheme(theme) ?? "light";
        docRoot.dataset.theme = normalized;
        if (persist) {
            writeStoredTheme(normalized);
        }
        if (els.themeToggle) {
            const isDark = normalized === "dark";
            const label = isDark ? "Switch to light theme" : "Switch to dark theme";
            els.themeToggle.setAttribute("aria-pressed", String(isDark));
            els.themeToggle.setAttribute("aria-label", label);
            els.themeToggle.setAttribute("title", label);
        }
    }

    function normalizeTheme(value) {
        return value === "dark" || value === "light" ? value : null;
    }

    function readStoredTheme() {
        try {
            const value = localStorage.getItem(THEME_STORAGE_KEY);
            return normalizeTheme(value);
        } catch (error) {
            console.warn("Unable to access theme preference", error);
            return null;
        }
    }

    function writeStoredTheme(value) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, value);
        } catch (error) {
            console.warn("Unable to persist theme preference", error);
        }
    }

    function subscribeToPreference(mediaQuery, handler) {
        if (!mediaQuery || typeof handler !== "function") return;
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handler);
        } else if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(handler);
        }
    }
})();
