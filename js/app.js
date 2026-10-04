const sb = window.supabaseClient;

// ============================================================
// EATKRISHNA — ADMIN PANEL
// ============================================================

// ───────────────── AUTHENTICATION ─────────────────

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  const errorBox = document.getElementById('login-error');
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    console.log('LOGIN DATA:', data);
    console.log('LOGIN ERROR:', error);

    if (error) throw error;

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';

    initializeDashboard();

  } catch (err) {
    console.error(err);

    errorBox.textContent = err.message || 'Login failed';
    errorBox.classList.remove('hidden');
  }
});

async function checkAuthState() {
  try {
    const { data, error } = await sb.auth.getSession();

    console.log('SESSION:', data);
    console.log('SESSION ERROR:', error);

    if (data?.session) {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';

      initializeDashboard();
    } else {
      document.getElementById('login-page').style.display = 'flex';
      document.getElementById('admin-panel').style.display = 'none';
    }
  } catch (err) {
    console.error('Auth state error:', err);
  }
}

async function logout() {
  await sb.auth.signOut();

  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

// ───────────────── INITIALIZE ─────────────────

function initializeDashboard() {
  loadStats();
  loadProducts();
  loadIngredients();
  loadVarieties();
  loadVarietyOptions();
  loadSizes();
  loadOrders();
  loadCustomizationOrders();

  sb
    .channel('products-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products'
      },
      () => {
        loadProducts();
        loadStats();
      }
    )
    .subscribe();
}

// ───────────────── NAVIGATION ─────────────────

function navigate(page, el) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  if (el) el.classList.add('active');

  document.querySelectorAll('.page').forEach(pageEl => {
    pageEl.classList.remove('active');
  });

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    products: 'Products',
    ingredients: 'Ingredients',
    varieties: 'Varieties',
    sizes: 'Sizes',
    orders: 'Orders',
    'customization-orders': 'Customization Orders'
  };

  document.getElementById('topbar-title').textContent =
    titles[page] || 'Dashboard';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ───────────────── HELPERS ─────────────────

function showToast(id, message, type = 'success') {
  const toast = document.getElementById(id);

  toast.textContent = message;
  toast.className = `toast toast--${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);

  if (!btn) return;

  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');

  btn.disabled = loading;

  if (text) text.classList.toggle('hidden', loading);
  if (loader) loader.classList.toggle('hidden', !loading);
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '—';

  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// ───────────────── PRODUCT FORM ─────────────────

// Dynamic Size Rows Logic
const addSizeBtn = document.getElementById("add-size-btn");
const sizesContainer = document.getElementById("sizes-container");

if (addSizeBtn && sizesContainer) {
  addSizeBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "size-row";
    row.innerHTML = `
      <input type="text" class="size-label" placeholder="250g / 500g / 1kg">
      <input type="number" class="size-price" placeholder="Price">
      <button type="button" class="btn-remove-size" title="Remove size" onclick="this.parentElement.remove()">×</button>
    `;
    sizesContainer.appendChild(row);
  });
}


async function submitProduct(e) {
  e.preventDefault();

  const badge = document.querySelector('input[name="p-badge"]:checked');
  const statusCheckbox = document.querySelector('.p-status-checkbox:checked');

  // Convert status checkbox value to proper type
  let isActiveValue = null;
  if (statusCheckbox) {
    const statusValue = statusCheckbox.value;
    if (statusValue === 'true') isActiveValue = true;
    else if (statusValue === 'false') isActiveValue = false;
    else if (statusValue === 'null') isActiveValue = null;
  }

  const imageFile = document.getElementById('p-image-file').files[0];

  if (!imageFile) {
    showToast('product-toast', 'Please select an image', 'error');
    return;
  }

  setLoading('product-submit-btn', true);

  try {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `product-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await sb.storage
      .from('product-images')
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const { data } = sb.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    const product = {
      title: document.getElementById('p-title').value.trim(),
      category: document.getElementById('p-category').value,
      price: parseFloat(document.getElementById('p-price').value),
      old_price: parseFloat(document.getElementById('p-old-price').value) || null,
      discount: parseFloat(document.getElementById('p-discount').value) || null,
      rating: parseFloat(document.getElementById('p-rating').value) || null,
      reviews: parseInt(document.getElementById('p-reviews').value) || 0,
      badge: badge ? badge.value : null,
      image_url: imageUrl,
      button_text:
        document.getElementById('p-button-text').value.trim() || 'Add to Cart',
      is_active: isActiveValue
    };

    const { data: productDataArray, error } = await sb
      .from('products')
      .insert([product])
      .select();

    if (error) throw error;

    const productData = productDataArray[0];

    // Save size rows into product_sizes
    const rows = document.querySelectorAll(".size-row");
    const sizeData = [];

    rows.forEach(row => {
      const label = row.querySelector(".size-label").value.trim();
      const price = parseFloat(row.querySelector(".size-price").value);

      if (label && !isNaN(price)) {
        sizeData.push({
          product_id: productData.id,
          size_label: label,
          price: price,
          is_active: true
        });
      }
    });

    if (sizeData.length > 0) {
      console.log("SIZE DATA:", sizeData);

      const { data, error: sizeError } = await sb
        .from('product_sizes')
        .insert(sizeData)
        .select();

      console.log("SIZE INSERT RESULT:", data);
      console.log("SIZE INSERT ERROR:", sizeError);

      if (sizeError) throw sizeError;
    }

    showToast('product-toast', 'Product added successfully');
    resetProductForm();

    loadProducts();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('product-toast', err.message, 'error');
  } finally {
    setLoading('product-submit-btn', false);
  }
}

// ───────────────── LOAD PRODUCTS ─────────────────

async function loadProducts() {
  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderProductCards('products-preview', data);
    renderProductCards('dashboard-preview', data.slice(0, 4));

  } catch (err) {
    console.error('Load Products Error:', err);
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;

  try {
    const { error } = await sb
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('product-toast', 'Product deleted successfully');

    loadProducts();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('product-toast', err.message, 'error');
  }
}

function renderProductCards(containerId, products) {
  const container = document.getElementById(containerId);

  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p>No products found.</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}

      <div class="product-img-wrap">
        <img src="${product.image_url}" alt="${product.title}">
      </div>

      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <div class="product-name">${product.title}</div>

        <div class="product-pricing">
          <span class="product-price">₹${product.price}</span>

          ${product.old_price ? `
            <span class="product-original">₹${product.old_price}</span>
          ` : ''}

          ${product.discount ? `
            <span class="product-discount">${product.discount}% OFF</span>
          ` : ''}
        </div>

        <div class="product-meta">
          ${product.rating ? `<span>★ ${product.rating}</span>` : ''}
          ${product.reviews ? `<span>(${product.reviews} reviews)</span>` : ''}
        </div>
        <div class="product-actions">
          <button onclick="deleteProduct('${product.id}')" class="btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function resetProductForm() {
  document.getElementById('product-form').reset();
  const filenameSpan = document.getElementById('p-image-filename');
  if (filenameSpan) filenameSpan.textContent = 'No file chosen';

  // Reset sizes container to one empty row
  const container = document.getElementById('sizes-container');
  if (container) {
    container.innerHTML = `
      <div class="size-row">
        <input type="text" class="size-label" placeholder="e.g. 250g / 500g / 1kg">
        <input type="number" class="size-price" placeholder="Price">
        <button type="button" class="btn-remove-size" title="Remove size" onclick="this.parentElement.remove()">×</button>
      </div>
    `;
  }
}

// ───────────────── INGREDIENTS ─────────────────

async function submitIngredient(e) {
  e.preventDefault();

  const statusCheckbox = document.querySelector('.i-status-checkbox:checked');

  // Convert status checkbox value to proper type
  let isActiveValue = null;
  if (statusCheckbox) {
    const statusValue = statusCheckbox.value;
    if (statusValue === 'true') isActiveValue = true;
    else if (statusValue === 'false') isActiveValue = false;
    else if (statusValue === 'null') isActiveValue = null;
  }

  const ingredient = {
    name: document.getElementById('i-name').value.trim(),
    category: document.getElementById('i-category').value,
    price: parseFloat(document.getElementById('i-price').value),
    variety_type: document.getElementById('i-variety-type').value.trim() || null,
    is_active: isActiveValue,
    description: document.getElementById('i-description').value.trim() || null,
  };

  setLoading('ingredient-submit-btn', true);

  try {
    const { error } = await sb
      .from('ingredients')
      .insert([ingredient]);

    if (error) throw error;

    showToast('ingredient-toast', 'Ingredient added successfully');
    document.getElementById('ingredient-form').reset();

    loadIngredients();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('ingredient-toast', err.message, 'error');
  } finally {
    setLoading('ingredient-submit-btn', false);
  }
}

async function addSampleIngredients() {
  const samples = [
    { name: 'Pista', category: 'Premium', price: 150, variety_type: 'Nuts', is_active: true, description: 'Premium quality pistachios' },
    { name: 'Mamra Badam', category: 'Bestseller', price: 200, variety_type: 'Nuts', is_active: true, description: 'High-quality almonds from Kashmir' },
    { name: 'Cashew', category: 'Popular', price: 120, variety_type: 'Nuts', is_active: true, description: 'Crunchy and delicious cashews' },
    { name: 'Walnuts', category: 'Premium', price: 180, variety_type: 'Nuts', is_active: true, description: 'Nutritious walnuts for health' },
    { name: 'Pumpkin Seeds', category: 'Popular', price: 80, variety_type: 'Seeds', is_active: true, description: 'Roasted pumpkin seeds' },
    { name: 'Watermelon Seeds', category: 'Gift', price: 60, variety_type: 'Seeds', is_active: true, description: 'Dried watermelon seeds' },
    { name: 'Sunflower Seeds', category: 'Popular', price: 70, variety_type: 'Seeds', is_active: true, description: 'Healthy sunflower seeds' },
    { name: 'Chia Seeds', category: 'Premium', price: 90, variety_type: 'Seeds', is_active: true, description: 'Superfood chia seeds' },
    { name: 'Flax Seeds', category: 'Bestseller', price: 85, variety_type: 'Seeds', is_active: true, description: 'Omega-3 rich flax seeds' },
    { name: 'Quinoa', category: 'Premium', price: 110, variety_type: 'Grains', is_active: true, description: 'Protein-rich quinoa' },
    { name: 'Muskmelon Seeds', category: 'Gift', price: 65, variety_type: 'Seeds', is_active: true, description: 'Sweet muskmelon seeds' },
    { name: 'Sesame Seeds', category: 'Popular', price: 75, variety_type: 'Seeds', is_active: true, description: 'Versatile sesame seeds' }
  ];

  try {
    const { error } = await sb
      .from('ingredients')
      .insert(samples);

    if (error) throw error;

    showToast('ingredient-toast', 'Sample ingredients added successfully');
    loadIngredients();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('ingredient-toast', err.message, 'error');
  }
}

function resetIngredientForm() {
  document.getElementById('ingredient-form').reset();
}

async function loadIngredients() {
  try {
    const { data, error } = await sb
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('ingredients-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No ingredients found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.variety_type || '-'}</td>
        <td>₹${item.price}</td>
        <td>${item.is_active === null ? 'Null' : item.is_active ? 'Active' : 'Inactive'}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button onclick="deleteIngredient('${item.id}')" class="btn-delete">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Ingredients Error:', err);
  }
}

async function deleteIngredient(id) {
  if (!confirm('Delete this ingredient?')) return;

  try {
    const { error } = await sb
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('ingredient-toast', 'Ingredient deleted successfully');

    loadIngredients();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('ingredient-toast', err.message, 'error');
  }
}

// ───────────────── STATS ─────────────────

async function loadStats() {
  try {
    const [
      { count: products }, 
      { count: ingredients }, 
      { count: varieties }, 
      { count: sizes },
      { count: productOrders },
      { count: customizedOrders }
    ] = await Promise.all([
      sb.from('products').select('*', { count: 'exact', head: true }),
      sb.from('ingredients').select('*', { count: 'exact', head: true }),
      sb.from('varieties').select('*', { count: 'exact', head: true }),
      sb.from('sizes').select('*', { count: 'exact', head: true }),
      sb.from('product_orders').select('*', { count: 'exact', head: true }),
      sb.from('customized_orders').select('*', { count: 'exact', head: true })
    ]);

    document.getElementById('stat-products').textContent = products || 0;
    document.getElementById('stat-ingredients').textContent = ingredients || 0;
    document.getElementById('stat-varieties').textContent = varieties || 0;
    document.getElementById('stat-sizes').textContent = sizes || 0;
    document.getElementById('stat-orders').textContent = productOrders || 0;
    document.getElementById('stat-customization-orders').textContent = customizedOrders || 0;

  } catch (err) {
    console.error('Stats Error:', err);
  }
}

// ───────────────── VARIETIES ─────────────────

async function submitVariety(e) {
  e.preventDefault();

  const statusCheckbox = document.querySelector('.v-status-checkbox:checked');

  // Convert status checkbox value to proper type
  let isActiveValue = true; // default to true as per user code
  if (statusCheckbox) {
    const statusValue = statusCheckbox.value;
    if (statusValue === 'true') isActiveValue = true;
    else if (statusValue === 'false') isActiveValue = false;
  }

  const varietyName = document.getElementById('v-name').value.trim();
  const varietyPrice = parseFloat(document.getElementById('v-price').value);
  const varietyDescription = document.getElementById('v-description').value.trim() || null;

  setLoading('variety-submit-btn', true);

  try {
    const { error } = await sb.from('varieties').insert([
      {
        name: varietyName,
        price: varietyPrice,
        description: varietyDescription,
        is_active: isActiveValue
      }
    ]);

    if (error) throw error;

    showToast('variety-toast', 'Variety added successfully');
    document.getElementById('variety-form').reset();

    loadVarieties();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('variety-toast', err.message, 'error');
  } finally {
    setLoading('variety-submit-btn', false);
  }
}

async function loadVarieties() {
  try {
    const { data, error } = await sb
      .from('varieties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('varieties-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No varieties found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>${item.is_active ? 'Active' : 'Inactive'}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button onclick="deleteVariety('${item.id}')" class="btn-delete">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Varieties Error:', err);
  }
}

async function deleteVariety(id) {
  if (!confirm('Delete this variety?')) return;

  try {
    const { error } = await sb
      .from('varieties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('variety-toast', 'Variety deleted successfully');

    loadVarieties();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('variety-toast', err.message, 'error');
  }
}

function resetVarietyForm() {
  document.getElementById('variety-form').reset();
}

// ───────────────── SIZES ─────────────────

async function loadVarietyOptions() {
  try {
    const { data: varieties, error } = await sb
      .from("varieties")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    const select = document.getElementById('s-variety');
    if (!select) return;

    select.innerHTML = '<option value="">— Select Variety —</option>' + 
      varieties.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  } catch (err) {
    console.error('Load Variety Options Error:', err);
  }
}

async function submitSize(e) {
  e.preventDefault();

  const statusCheckbox = document.querySelector('.s-status-checkbox:checked');

  // Convert status checkbox value to proper type
  let isActiveValue = true; // default to true as per user code
  if (statusCheckbox) {
    const statusValue = statusCheckbox.value;
    if (statusValue === 'true') isActiveValue = true;
    else if (statusValue === 'false') isActiveValue = false;
  }

  const varietyId = document.getElementById('s-variety').value;
  const sizeName = document.getElementById('s-size').value.trim();
  const weightGrams = document.getElementById('s-weight-grams').value;
  const sizePrice = parseFloat(document.getElementById('s-price').value);

  setLoading('size-submit-btn', true);

  try {
    const { error } = await sb.from('sizes').insert([
      {
        variety_id: varietyId,
        size: sizeName,
        weight_grams: Number(weightGrams),
        price: Number(sizePrice),
        is_active: isActiveValue
      }
    ]);

    if (error) throw error;

    showToast('size-toast', 'Size added successfully');
    document.getElementById('size-form').reset();

    loadSizes();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('size-toast', err.message, 'error');
  } finally {
    setLoading('size-submit-btn', false);
  }
}

async function loadSizes() {
  try {
    const { data, error } = await sb
      .from('sizes')
      .select(`
        *,
        varieties (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('sizes-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No sizes found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.varieties ? item.varieties.name : '-'}</td>
        <td>${item.size}</td>
        <td>${item.weight_grams}g</td>
        <td>₹${item.price}</td>
        <td>${item.is_active ? 'Active' : 'Inactive'}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button onclick="deleteSize('${item.id}')" class="btn-delete">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Sizes Error:', err);
  }
}

async function deleteSize(id) {
  if (!confirm('Delete this size?')) return;

  try {
    const { error } = await sb
      .from('sizes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('size-toast', 'Size deleted successfully');

    loadSizes();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('size-toast', err.message, 'error');
  }
}

function resetSizeForm() {
  document.getElementById('size-form').reset();
}

// ───────────────── LOAD ORDERS ─────────────────

async function loadOrders() {
  try {
    const { data, error } = await sb
      .from('product_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map type for the template
    const orders = (data || []).map(o => ({ ...o, _type: 'standard' }));

    console.log('Product Orders:', orders);

    renderOrders(orders);

  } catch (err) {
    console.error('Load Orders Error:', err);
  }
}

function renderOrders(data) {
  const container = document.getElementById('orders-container');
  if (!container) return;
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state">No orders found.</div>';
    return;
  }
  container.innerHTML = data.map(order => {
    console.log('Rendering standard page order:', order);
    return renderOrderCardTemplate(order);
  }).join('');
}

async function loadCustomizationOrders() {
  try {
    const { data, error } = await sb
      .from('customized_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map type for the template
    const orders = (data || []).map(o => ({ ...o, _type: 'custom' }));

    console.log('Customization Orders:', orders);

    renderCustomizationOrders(orders);
  } catch (err) {
    console.error('Load Customization Orders Error:', err);
  }
}

function renderCustomizationOrders(data) {
  const container = document.getElementById('customization-orders-container');
  if (!container) return;
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state">No customization orders found.</div>';
    return;
  }
  container.innerHTML = data.map(order => {
    console.log('Rendering customization page order:', order);
    return renderOrderCardTemplate(order);
  }).join('');
}

function getStatusClass(status) {
  if (!status) return 'pending';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('complete')) return 'completed';
  if (statusLower.includes('process')) return 'processing';
  if (statusLower.includes('cancel')) return 'cancelled';
  return 'pending';
}

// Helper for unified order rendering
function renderOrderCardTemplate(order) {
    const isCustom = order._type === 'custom' || !!order.customized_product_name;
    const isCancelled = order.order_status?.toLowerCase().includes('cancel');
    
    // Cancel Reason Display
    const cancelReasonHtml = isCancelled 
      ? `
        <div class="order-detail-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(217, 83, 79, 0.2); color: #d9534f;">
          <span class="order-detail-label" style="color: #d9534f; font-weight: 600;">Cancel Reason:</span>
          <span class="order-detail-value">${order.cancel_reason || "No reason provided"}</span>
        </div>
      ` 
      : '';

    let detailsHtml = '';
    let pricingHtml = '';

    if (!isCustom) {
      // Standard Product Order details
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      } catch (e) { items = []; }

      const itemsListHtml = items.length ? items.map((item, index) => `
          <div class="order-item-row" style="margin-bottom: 8px; padding-bottom: 8px; ${index < items.length - 1 ? 'border-bottom: 1px solid rgba(0,0,0,0.05);' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: var(--text-primary);">${item.name || 'Unknown Product'}</span>
              <span style="font-weight: 600; color: var(--brown-dark);">₹${(item.price || 0) * (item.qty || 1)}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 10px;">
              <span><strong>Size:</strong> ${item.selected_size || '-'}</span>
              <span><strong>Qty:</strong> ${item.qty || 1}</span>
              <span><strong>Price:</strong> ₹${item.price || 0}</span>
            </div>
          </div>
        `).join('') : '<p>No items found</p>';

      detailsHtml = `<div class="order-items"><strong>Items:</strong><div class="order-items-list">${itemsListHtml}</div></div>`;
      pricingHtml = `
        <div class="order-pricing">
          <div class="order-pricing-row"><span>Subtotal:</span><span>₹${order.subtotal || 0}</span></div>
          <div class="order-pricing-row"><span>Shipping:</span><span>₹${order.shipping || 0}</span></div>
          <div class="order-pricing-row total"><span>Total:</span><span>₹${order.total || 0}</span></div>
        </div>
      `;
    } else {
      // Customization Order details
      const parseList = (val) => {
        if (!val) return 'None';
        let parsed = val;
        if (typeof val === 'string') { try { parsed = JSON.parse(val); } catch(e) { return val; } }
        if (Array.isArray(parsed)) return parsed.map(item => (typeof item === 'object' && item !== null) ? (item.name || item.label || item.title || JSON.stringify(item)) : item).join(', ');
        return String(parsed);
      };
      
      detailsHtml = `
        <div class="order-detail-row" style="border-top: 1px solid #f0f0f0; margin-top: 8px; padding-top: 8px;">
          <span class="order-detail-label">Base Product:</span>
          <span class="order-detail-value">${order.customized_product_name || 'N/A'}</span>
        </div>
        <div class="order-items">
          <strong>Configuration:</strong>
          <div class="order-items-list" style="margin-top: 8px;">
            <div class="order-item-row" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">Ingredients:</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4;">${parseList(order.ingredients)}</div>
            </div>
            <div class="order-item-row" style="margin-bottom: 8px;">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">Customizations:</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4;">${parseList(order.customizations)}</div>
            </div>
          </div>
        </div>
      `;
      pricingHtml = `
        <div class="order-pricing">
          <div class="order-pricing-row"><span>Quantity:</span><span>${order.quantity || 1}</span></div>
          <div class="order-pricing-row total"><span>Total Price:</span><span>₹${order.total_price || 0}</span></div>
        </div>
      `;
    }

    const orderTypeLabel = isCustom ? '<span style="font-size: 10px; background: #f3e5f5; color: #7b1fa2; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">Custom</span>' : '';

    return `
      <div class="order-card">
        <div class="order-header">
          <h3 class="order-number">Order #${order.order_number || 'N/A'} ${orderTypeLabel}</h3>
          <span class="order-status ${getStatusClass(order.order_status)}">${order.order_status || 'Pending'}</span>
        </div>
        <div class="order-details">
          <div class="order-detail-row"><span class="order-detail-label">Customer:</span><span class="order-detail-value">${order.customer_name || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Email:</span><span class="order-detail-value">${order.customer_email || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Phone:</span><span class="order-detail-value">${order.customer_phone || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Address:</span><span class="order-detail-value">${order.customer_address || ''}, ${order.customer_city || ''} ${order.customer_pincode || ''}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Payment:</span><span class="order-detail-value">${order.payment_method || 'N/A'} (${order.payment_status || 'N/A'})</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Placed On:</span><span class="order-detail-value">${formatDateTime(order.created_at)}</span></div>
          ${cancelReasonHtml}
        </div>
        ${detailsHtml}
        ${pricingHtml}
        <div class="order-actions">
          ${!isCancelled && order.order_status !== 'Completed' ? `
            <button onclick="completeOrderGeneric('${order.id}', '${isCustom ? 'customized_orders' : 'product_orders'}')" class="btn-order-action btn-complete">Complete</button>
            <button onclick="cancelOrderPrompt('${order.id}', '${isCustom ? 'customized_orders' : 'product_orders'}')" class="btn-order-action" style="background: #f0ad4e; color: white; border: none;">Cancel</button>
          ` : ''}
          <button onclick="deleteOrderGeneric('${order.id}', '${isCustom ? 'customized_orders' : 'product_orders'}')" class="btn-order-action btn-delete">Delete</button>
        </div>
      </div>
    `;
}

// ───────────────── ORDER ACTIONS ─────────────────

async function deleteOrder(id, table = 'product_orders') {
  if (!confirm('Delete this order?')) return;

  try {
    const { error } = await sb
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast(table.includes('custom') ? 'customization-toast' : 'order-toast', 'Order deleted successfully');

    loadOrders();
    loadCustomizationOrders();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('order-toast', err.message, 'error');
  }
}

async function deleteOrderGeneric(id, table) {
    return deleteOrder(id, table);
}

async function completeOrder(id, table = 'product_orders') {
  if (!confirm('Mark this order as completed?')) return;

  try {
    const { error } = await sb
      .from(table)
      .update({ order_status: 'Completed' })
      .eq('id', id);

    if (error) throw error;

    showToast(table.includes('custom') ? 'customization-toast' : 'order-toast', 'Order marked as completed successfully');

    loadOrders();
    loadCustomizationOrders();
    loadStats();
  } catch (err) {
    console.error(err);
    showToast('order-toast', err.message, 'error');
  }
}

async function completeOrderGeneric(id, table) {
    return completeOrder(id, table);
}

async function cancelOrderPrompt(id, table) {
  const reason = prompt('Please enter the reason for cancellation:', 'Customer requested cancellation');
  if (reason === null) return; // Cancelled prompt

  try {
    const { error } = await sb
      .from(table)
      .update({ 
        order_status: 'Cancelled',
        cancel_reason: reason || 'No reason provided'
      })
      .eq('id', id);

    if (error) throw error;

    showToast(table.includes('custom') ? 'customization-toast' : 'order-toast', 'Order cancelled successfully');

    // Ensure Re-render: Refresh data after cancellation
    loadOrders();
    loadCustomizationOrders();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('order-toast', err.message, 'error');
  }
}

function viewOrder(id) {
  alert('Order ID: ' + id + '\n\nDetailed view functionality can be implemented to show full order details in a modal.');
}

// These are now handled by generic functions above
async function deleteCustomizationOrder(id) { return deleteOrder(id, 'customized_orders'); }
async function completeCustomizationOrder(id) { return completeOrder(id, 'customized_orders'); }
function viewCustomizationOrder(id) { viewOrder(id); }

// ───────────────── START ─────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();

  // Initialize status checkboxes to work like radio buttons
  const allStatusCheckboxes = document.querySelectorAll('.p-status-checkbox, .i-status-checkbox, .v-status-checkbox, .s-status-checkbox');
  allStatusCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        // Uncheck all other status checkboxes in the same group
        const groupClass = this.className.split(' ').find(cls => cls.endsWith('-status-checkbox'));
        const groupCheckboxes = document.querySelectorAll('.' + groupClass);
        groupCheckboxes.forEach(cb => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
});
