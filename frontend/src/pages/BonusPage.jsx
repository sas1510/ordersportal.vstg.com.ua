import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import axiosInstance from "../api/axios";
import ConfirmModal from "../components/Orders/ConfirmModal";
import { AppIcon } from "../components/Icons/AppIcon";
import { useNotification } from "../hooks/useNotification";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import "./BonusPage.css";

const DEFAULT_CATEGORY_ORDER = [
  "Каталоги",
  "Зразки профільних систем",
  "Брендована продукція",
  "Одяг",
  "Канцтовари",
  "Інструменти",
];

const BONUS_PRODUCTS_API = "/bonus-products/";

const createInitialForm = () => ({
  name: "",
  category: "",
  price: "",
  displayOrder: 0,
  isActive: true,
  imageFile: null,
  imagePreview: "",
});

function BonusCoin({ small = false }) {
  return (
    <AppIcon
      name="BonusIcon"
      className={small ? "bonus-page__coin-icon bonus-page__coin-icon--small" : "bonus-page__coin-icon"}
    />
  );
}

const steps = [
  {
    number: "1",
    icon: <AppIcon name="firstStepBonus" className="bonus-page__how-it-works-app-icon" />,
    title: "Обирай товари",
    description: "Додавай товари до кошика",
  },
  {
    number: "2",
    icon: <AppIcon name="secondStepBonus" className="bonus-page__how-it-works-app-icon" />,
    title: "Оплачуй балами",
    description: "Використовуй бали для оплати замовлення",
  },
  {
    number: "3",
    icon: <AppIcon name="thirdStepBonus" className="bonus-page__how-it-works-app-icon bonus-page__how-it-works-app-icon--wide" />,
    title: "Оформлюй та насолоджуйся",
    description: "Ми швидко доставимо ваше замовлення",
  },
];

function HowItWorks() {
  return (
    <div className="bonus-page__how-it-works">
      <span className="bonus-page__how-it-works-label">Як це працює?</span>

      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {index > 0 && <AppIcon name="arrowDown" className="bonus-page__how-it-works-arrow" />}

          <div className="bonus-page__how-it-works-step">
            <span className="bonus-page__how-it-works-number">{step.number}</span>
            <div className="bonus-page__how-it-works-icon">{step.icon}</div>
            <div className="bonus-page__how-it-works-text">
              <span className="bonus-page__how-it-works-title">{step.title}</span>
              <span className="bonus-page__how-it-works-description">{step.description}</span>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function BonusBalance() {
  return (
    <section className="bonus-page__balance-card">
      <div className="bonus-page__balance-label">Ваш баланс балобонусів</div>
      <div className="bonus-page__balance-main">
        <BonusCoin />
        <strong>2 790</strong>
      </div>
      <div className="bonus-page__balance-rate">1 бал = 1 грн</div>
      <button type="button" className="bonus-page__history-button">
        <AppIcon name="historyBonusIcon" className="bonus-page__history-icon" />
        Історія балів
      </button>
    </section>
  );
}

function BonusCategories({ categories, selected, onSelect }) {
  return (
    <nav className="bonus-page__categories-list">
      {categories.map(({ name, count }, index) => {
        const isActive = selected === name;

        return (
          <div key={name} className="bonus-page__category-row">
            <button
              type="button"
              className={isActive ? "bonus-page__category active" : "bonus-page__category"}
              onClick={() => onSelect(name)}
            >
              <span className="bonus-page__category-label">{name}</span>
              <span className={isActive ? "bonus-page__category-badge active" : "bonus-page__category-badge"}>
                {count}
              </span>
            </button>
            {index < categories.length - 1 && <div className="bonus-page__category-separator" />}
          </div>
        );
      })}
    </nav>
  );
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = product.image_src || product.image;

  return (
    <div className="bonus-page__product-image">
      {!imageSrc || failed ? (
        <div className="bonus-page__product-placeholder">
          <Package size={28} />
        </div>
      ) : (
        <img src={imageSrc} alt={product.name} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function ProductCard({ product, isAdmin, onEdit, onDelete }) {
  const cardClassName = product.is_active
    ? "bonus-page__product-card"
    : "bonus-page__product-card bonus-page__product-card--inactive";

  return (
    <article className={cardClassName}>
      <ProductImage product={product} />
      <h3>{product.name}</h3>
      <div className="bonus-page__product-bottom">
        <div className="bonus-page__price">
          <BonusCoin small />
          <b>{product.price}</b>
        </div>
        <button type="button" className="bonus-page__buy-button">
          Додати за бали
        </button>
      </div>
      {isAdmin && (
        <div className="bonus-page__product-admin-actions">
          {!product.is_active && <span className="bonus-page__product-status">Прихований</span>}
          <button type="button" className="bonus-page__ghost-button" onClick={() => onEdit(product)}>
            <Pencil size={14} />
            Редагувати
          </button>
          <button
            type="button"
            className="bonus-page__ghost-button bonus-page__ghost-button--danger"
            onClick={() => onDelete(product)}
          >
            <Trash2 size={14} />
            Видалити
          </button>
        </div>
      )}
    </article>
  );
}

function BonusAdminPanel({
  categories,
  form,
  isEditing,
  isSaving,
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
  onClose,
}) {
  return (
    <section className="bonus-page__admin-panel">
      <div className="bonus-page__admin-header">
        <div>
          <h3>{isEditing ? "Редагування товару" : "Новий бонусний товар"}</h3>
          <p>Адмін може додавати, змінювати і приховувати товари прямо з порталу.</p>
        </div>
        <button type="button" className="bonus-page__admin-close" onClick={onClose} aria-label="Закрити">
          <X size={18} />
        </button>
      </div>

      <form className="bonus-page__admin-form" onSubmit={onSubmit}>
        <label className="bonus-page__field">
          <span>Назва товару</span>
          <input name="name" value={form.name} onChange={onChange} placeholder="Наприклад, Кепка Вікна Стиль" />
        </label>

        <label className="bonus-page__field">
          <span>Категорія</span>
          <input
            name="category"
            value={form.category}
            onChange={onChange}
            list="bonus-page-categories"
            placeholder="Наприклад, Одяг"
          />
          <datalist id="bonus-page-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="bonus-page__field">
          <span>Ціна в балах</span>
          <input name="price" type="number" min="0" value={form.price} onChange={onChange} placeholder="0" />
        </label>

        <label className="bonus-page__field bonus-page__field--file">
          <span>Фото товару</span>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFileChange} />
          {form.imagePreview && (
            <img className="bonus-page__admin-preview" src={form.imagePreview} alt="Попередній перегляд" />
          )}
        </label>

        <label className="bonus-page__checkbox">
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={onChange} />
          <span>Показувати товар дилерам</span>
        </label>

        <div className="bonus-page__admin-actions">
          <button type="submit" className="bonus-page__admin-submit" disabled={isSaving}>
            <Plus size={16} />
            {isSaving ? "Збереження..." : isEditing ? "Оновити товар" : "Додати товар"}
          </button>
          {isEditing && (
            <button type="button" className="bonus-page__admin-cancel" onClick={onCancel}>
              Скасувати редагування
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BonusPage() {
  const { isAdmin, user } = useAuthGetRole();
  const { addNotification } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState("Всі товари");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createInitialForm());
  const [editingProductId, setEditingProductId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const greetingName = useMemo(() => {
    const fullName = String(user?.full_name || user?.username || "").trim();
    return fullName || "Рута Магазин";
  }, [user]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? BONUS_PRODUCTS_API : BONUS_PRODUCTS_API + "?is_active=true";
      const response = await axiosInstance.get(endpoint);
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setProducts(data);
    } catch (error) {
      addNotification("Не вдалося завантажити бонусні товари.", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification, isAdmin]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categoryOptions = useMemo(() => {
    const categoryCounts = new Map();

    for (const item of products) {
      if (!isAdmin && !item.is_active) {
        continue;
      }
      const categoryName = item.category || "Без категорії";
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
    }

    const orderedNames = [
      ...DEFAULT_CATEGORY_ORDER.filter((name) => categoryCounts.has(name)),
      ...Array.from(categoryCounts.keys())
        .filter((name) => !DEFAULT_CATEGORY_ORDER.includes(name))
        .sort((a, b) => a.localeCompare(b, "uk")),
    ];

    return [
      { name: "Всі товари", count: Array.from(categoryCounts.values()).reduce((sum, value) => sum + value, 0) },
      ...orderedNames.map((name) => ({ name, count: categoryCounts.get(name) || 0 })),
    ];
  }, [isAdmin, products]);

  useEffect(() => {
    if (!categoryOptions.some((item) => item.name === selectedCategory)) {
      setSelectedCategory("Всі товари");
    }
  }, [categoryOptions, selectedCategory]);

  const visibleProducts = useMemo(() => {
    const source = isAdmin ? products : products.filter((product) => product.is_active);
    if (selectedCategory === "Всі товари") return source;
    return source.filter((product) => product.category === selectedCategory);
  }, [isAdmin, products, selectedCategory]);

  const categoryNames = useMemo(
    () => categoryOptions.filter((item) => item.name !== "Всі товари").map((item) => item.name),
    [categoryOptions],
  );

  const resetForm = useCallback(() => {
    setForm(createInitialForm());
    setEditingProductId(null);
  }, []);

  const closeAdminModal = useCallback(() => {
    setAdminModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setAdminModalOpen(true);
  }, [resetForm]);

  const handleFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null }));
      return;
    }

    const preview = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: preview,
    }));
  }, []);

  const handleEdit = useCallback((product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "",
      price: product.price ?? "",
      displayOrder: product.display_order ?? 0,
      isActive: Boolean(product.is_active),
      imageFile: null,
      imagePreview: product.image_src || "",
    });
    setAdminModalOpen(true);
  }, []);

  const handleDelete = useCallback((product) => {
    setDeleteTarget(product);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      addNotification("Вкажіть назву товару.", "warning");
      return;
    }

    if (!form.category.trim()) {
      addNotification("Вкажіть категорію товару.", "warning");
      return;
    }

    if (form.price === "") {
      addNotification("Вкажіть вартість у балах.", "warning");
      return;
    }

    if (!editingProductId && !form.imageFile) {
      addNotification("Додайте фото товару.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        display_order: Number(form.displayOrder || 0),
        is_active: Boolean(form.isActive),
      };

      if (form.imageFile) {
        payload.image_base64 = await fileToDataUrl(form.imageFile);
        payload.image_extension = form.imageFile.name.split(".").pop()?.toLowerCase() || "png";
      }

      if (editingProductId) {
        await axiosInstance.put(BONUS_PRODUCTS_API + editingProductId + "/", payload);
        addNotification("Бонусний товар оновлено.", "success");
      } else {
        await axiosInstance.post(BONUS_PRODUCTS_API, payload);
        addNotification("Бонусний товар додано.", "success");
      }

      resetForm();
      setAdminModalOpen(false);
      fetchProducts();
    } catch (error) {
      addNotification("Не вдалося зберегти бонусний товар.", "error");
    } finally {
      setSaving(false);
    }
  }, [addNotification, editingProductId, fetchProducts, form, resetForm]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(BONUS_PRODUCTS_API + deleteTarget.id + "/");
      addNotification("Бонусний товар видалено.", "success");
      if (editingProductId === deleteTarget.id) {
        resetForm();
      }
      fetchProducts();
    } catch (error) {
      addNotification("Не вдалося видалити бонусний товар.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }, [addNotification, deleteTarget, editingProductId, fetchProducts, resetForm]);

  return (
    <div className="bonus-page">
      <div className="bonus-page__shell">
        <section className="bonus-page__intro">
          <div className="bonus-page__welcome">
            <h1>Вітаємо, {greetingName}!</h1>
            <p>Ваші бали чекають на вас</p>
          </div>

          <HowItWorks />
        </section>

        <section className="bonus-page__content">
          <aside className="bonus-page__sidebar">
            <BonusBalance />

            <div className="bonus-page__mobile-filter-wrap">
              <button
                type="button"
                className="bonus-page__mobile-filter-button"
                onClick={() => setMobileFiltersOpen((value) => !value)}
              >
                Категорії
                <ChevronDown
                  className={mobileFiltersOpen ? "bonus-page__mobile-filter-icon open" : "bonus-page__mobile-filter-icon"}
                  size={18}
                />
              </button>
              {mobileFiltersOpen && (
                <div className="bonus-page__mobile-filter-panel">
                  <BonusCategories
                    categories={categoryOptions}
                    selected={selectedCategory}
                    onSelect={(value) => {
                      setSelectedCategory(value);
                      setMobileFiltersOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bonus-page__categories-panel">
              <BonusCategories categories={categoryOptions} selected={selectedCategory} onSelect={setSelectedCategory} />
            </div>
          </aside>

          <section className="bonus-page__catalog">
            <div className="bonus-page__catalog-header bonus-page__catalog-header--split">
              <h2>Каталог товарів</h2>
              {isAdmin ? (
                <div className="bonus-page__admin-toolbar">
                  <span className="bonus-page__catalog-meta">Керування товарами доступне тільки адміну</span>
                  <button
                    type="button"
                    className="bonus-page__admin-submit bonus-page__admin-open"
                    onClick={openCreateModal}
                  >
                    <Plus size={16} />
                    Додати товар
                  </button>
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="bonus-page__empty-state">Завантажуємо бонусні товари...</div>
            ) : visibleProducts.length === 0 ? (
              <div className="bonus-page__empty-state">Поки що бонусних товарів немає.</div>
            ) : (
              <div className="bonus-page__product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {isAdmin && adminModalOpen && (
        <div className="bonus-page__admin-modal-overlay" onClick={closeAdminModal}>
          <div className="bonus-page__admin-modal" onClick={(event) => event.stopPropagation()}>
            <BonusAdminPanel
              categories={categoryNames}
              form={form}
              isEditing={Boolean(editingProductId)}
              isSaving={saving}
              onChange={handleFormChange}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              onClose={closeAdminModal}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Видалити бонусний товар?"
        message={deleteTarget ? 'Товар "' + deleteTarget.name + '" буде видалено без можливості швидкого відновлення.' : ""}
        confirmText="Видалити"
        cancelText="Скасувати"
        type="danger"
      />
    </div>
  );
}
