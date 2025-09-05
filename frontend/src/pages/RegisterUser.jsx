import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    firstLastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    organizationCode1C: "",
    regionId: "",
    contractorCode: "",
    managerCode: "", 
    regionalManagerCode: "",
    userType: "Dealer",
    isActive: true,
    activityEndDate: "",
    financialOperations: false,
    autoApprove: false,
    photo: null,
  });

  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [regions, setRegions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [managers1C, setManagers1C] = useState([]);
  const [regionalManagers1C, setRegionalManagers1C] = useState([]);

  // Завантаження регіонів
  useEffect(() => {
    async function fetchRegions() {
      try {
        const response = await axiosInstance.get('/regions');
        setRegions(response.data);
      } catch (error) {
        console.error('Помилка завантаження регіонів', error);
      }
    }
    fetchRegions();
  }, []);

  // Завантаження організацій
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await axiosInstance.get('/organizations/db');
        setOrganizations(response.data);
      } catch (error) {
        console.error('Помилка завантаження організацій', error);
      }
    }
    fetchOrganizations();
  }, []);

  // Перевірка прав адміністратора
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
      navigate('/');
    } else {
      setIsAdmin(true);
    }
  }, [navigate]);

 // Підвантаження контрагентів при зміні організації
useEffect(() => {
  async function fetchContractors() {
    // Якщо організація не обрана, очищаємо список
    if (!formData.organizationCode1C) {
      setContractors([]);
      setFormData(prev => ({ ...prev, contractorCode: "" }));
      return;
    }

    // Завантажуємо контрагентів тільки для користувачів типу "Dealer"
    if (formData.userType === "Dealer") {
      try {
        const response = await axiosInstance.get(
          `/contractors/by-organization?firm=${formData.organizationCode1C}`
        );
        setContractors(response.data);
        setFormData(prev => ({ ...prev, contractorCode: "" }));
      } catch (error) {
        console.error('Помилка завантаження контрагентів', error);
      }
    } else {
      // Для інших типів користувачів очищаємо список
      setContractors([]);
      setFormData(prev => ({ ...prev, contractorCode: "" }));
    }
  }

  fetchContractors();
}, [formData.organizationCode1C, formData.userType]);


  // Підвантаження менеджерів та регіональних менеджерів
  useEffect(() => {
    async function fetchManagers() {
      if (!formData.organizationCode1C) {
        setManagers1C([]);
        setRegionalManagers1C([]);
        setFormData(prev => ({ ...prev, managerCode: "", regionalManagerCode: "" }));
        return;
      }

      try {
        if (["Dealer", "Manager"].includes(formData.userType)) {
          const managersRes = await axiosInstance.get(
            `/managerssync/get-managers-by-organization?organization=${formData.organizationCode1C}`
          );
          setManagers1C(managersRes.data);
          setFormData(prev => ({ ...prev, managerCode: "" }));
        } else {
          setManagers1C([]);
          setFormData(prev => ({ ...prev, managerCode: "" }));
        }

        if (["Dealer", "Manager", "RegionalManager"].includes(formData.userType)) {
          const regionalRes = await axiosInstance.get(
            `/managerssync/get-regional-managers-by-organization?organization=${formData.organizationCode1C}`
          );
          setRegionalManagers1C(regionalRes.data);
          setFormData(prev => ({ ...prev, regionalManagerCode: "" }));
        } else {
          setRegionalManagers1C([]);
          setFormData(prev => ({ ...prev, regionalManagerCode: "" }));
        }
      } catch (error) {
        console.error("Помилка завантаження даних", error);
      }
    }
    fetchManagers();
  }, [formData.organizationCode1C, formData.userType]);

  // Обробка зміни полів форми
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Валідація форми
  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = "Логін обов’язковий";
    else if (formData.username.trim().length < 3) newErrors.username = "Логін має бути не менше 3 символів";

    if (!formData.firstLastName.trim()) newErrors.firstLastName = "ПІБ обов’язкове";

    if (!formData.email.trim()) newErrors.email = "Email обов’язковий";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Невірний формат email";

    if (!formData.phone.trim()) newErrors.phone = "Телефон обов’язковий";
    else if (!/^[\d+\-\s()]{6,20}$/.test(formData.phone)) newErrors.phone = "Невірний формат телефону";

    if (!formData.password) newErrors.password = "Пароль обов’язковий";
    else if (formData.password.length < 8) newErrors.password = "Пароль має бути не менше 8 символів";

    if (!formData.confirmPassword) newErrors.confirmPassword = "Підтвердження пароля обов’язкове";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Паролі не співпадають";

    if (formData.isActive && formData.activityEndDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const activityDate = new Date(formData.activityEndDate);
      if (activityDate < today) newErrors.activityEndDate = "Дата завершення активності не може бути в минулому";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Надсилання форми
 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) {
    setMessage('Будь ласка, виправте помилки в формі');
    return;
  }

  try {
    const formPayload = new FormData();

    // Додаємо усі поля, крім organizationCode1C і FK-полів, які будемо формувати окремо
    Object.entries(formData).forEach(([key, value]) => {
      if (!["organizationCode1C", "contractorCode", "managerCode", "regionalManagerCode"].includes(key) && value !== null) {
        formPayload.append(key, value);
      }
    });

    // organizationId через code_1c
    const selectedOrg = organizations.find(org => org.code_1c === formData.organizationCode1C);
    if (selectedOrg) {
      formPayload.append("organizationId", selectedOrg.id);
    }

    // FK для різних типів користувачів
    switch(formData.userType) {
      case "Dealer":
        if (formData.contractorCode) formPayload.append("ContractorCode", formData.contractorCode);
        if (formData.managerCode) formPayload.append("ManagerCode", formData.managerCode);
        if (formData.regionalManagerCode) formPayload.append("RegionalManagerCode", formData.regionalManagerCode);
        break;
      case "Manager":
        if (formData.managerCode) formPayload.append("ContractorCode", formData.managerCode);
        if (formData.regionalManagerCode) formPayload.append("RegionalManagerCode", formData.regionalManagerCode);
        break;
      case "RegionalManager":
        if (formData.regionalManagerCode) formPayload.append("ContractorCode", formData.regionalManagerCode);
        break;
      default:
        // Інші користувачі не мають FK
        break;
    }

    await axiosInstance.post(`/auth/register`, formPayload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setMessage('✅ Користувача створено успішно!');
    setFormData({
      username: "",
      firstLastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      organizationCode1C: "",
      regionId: "",
      contractorCode: "",
      managerCode: "",
      regionalManagerCode: "",
      userType: "Dealer",
      isActive: true,
      activityEndDate: "",
      financialOperations: false,
      autoApprove: false,
      photo: null,
    });
    setErrors({});
    setContractors([]);
    setManagers1C([]);
    setRegionalManagers1C([]);
  } catch (err) {
    setMessage(err.response?.data || '❌ Помилка при реєстрації');
  }
};



  if (!isAdmin) return null;

  const userTypes = [
    { value: "Admin", label: "Адміністратор" },
    { value: "Dealer", label: "Дилер" },
    { value: "Manager", label: "Менеджер" },
    { value: "RegionalManager", label: "Регіональний менеджер" },
    { value: "Director", label: "Директор" },
  ];

  const showActivityEndDate = ["Admin", "Dealer", "Manager", "RegionalManager", "Director"].includes(formData.userType);
  const showPhotoUpload = ["Manager", "RegionalManager"].includes(formData.userType);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 sm:p-10 bg-gray-50 rounded-xl shadow-lg">
      <h1 className="text-center text-3xl font-bold text-[#003d66] mb-8">Реєстрація нового користувача</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Логін */}
        <div>
          <input type="text" name="username" placeholder="Логін" value={formData.username} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
        </div>

        {/* ПІБ */}
        <div>
          <input type="text" name="firstLastName" placeholder="Прізвище та ім'я" value={formData.firstLastName} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.firstLastName && <p className="mt-1 text-xs text-red-600">{errors.firstLastName}</p>}
        </div>

        {/* Пароль */}
        <div>
          <input type="password" name="password" placeholder="Пароль" value={formData.password} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        {/* Підтвердження пароля */}
        <div>
          <input type="password" name="confirmPassword" placeholder="Підтвердження пароля" value={formData.confirmPassword} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>

        {/* Тип користувача */}
        <div>
          <select name="userType" value={formData.userType} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
            {userTypes.map(ut => <option key={ut.value} value={ut.value}>{ut.label}</option>)}
          </select>
        </div>

        {/* Організація */}
        <div>
          <select name="organizationCode1C" value={formData.organizationCode1C} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
            <option value="">-- Оберіть організацію --</option>
            {organizations.map(org => <option key={org.code_1c} value={org.code_1c}>{org.name}</option>)}
          </select>
        </div>

        {/* Контрагент */}
        {contractors.length > 0 && (
          <div>
            <select name="contractorCode" value={formData.contractorCode} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
              <option value="">-- Оберіть контрагента --</option>
             {contractors.map(k => (
                <option key={k.kod} value={k.kod}>{k.name}</option>
              ))}

            </select>
          </div>
        )}

        {/* Менеджери 1С */}
        {managers1C.length > 0 && (
          <div>
            <select name="managerCode" value={formData.managerCode} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
              <option value="">-- Оберіть менеджера --</option>
              {managers1C.map(u => (
                <option key={u._1c_ID} value={u._1c_ID}>{u._1c_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Регіональні менеджери */}
        {regionalManagers1C.length > 0 && (
          <div>
            <select name="regionalManagerCode" value={formData.regionalManagerCode} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
              <option value="">-- Оберіть регіонального менеджера --</option>
              {regionalManagers1C.map(u => (
                <option key={u._1c_ID} value={u._1c_ID}>{u._1c_name}</option>
              ))}
            </select>
          </div>
        )}

      
      <select name="regionId" value={formData.regionId} onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]">
          <option value="">-- Оберіть регіон --</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>


        {/* Активність */}
        <div className="sm:col-span-2 flex items-center space-x-2">
          <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
          <label>Активний користувач</label>
        </div>

        {/* Дата завершення активності */}
        {showActivityEndDate && (
          <div>
            <input type="date" name="activityEndDate" value={formData.activityEndDate} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
            {errors.activityEndDate && <p className="mt-1 text-xs text-red-600">{errors.activityEndDate}</p>}
          </div>
        )}

        {/* Фото */}
        {showPhotoUpload && (
          <div>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} />
          </div>
        )}

        {/* Email */}
        <div>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Телефон */}
        <div>
          <input type="text" name="phone" placeholder="Телефон" value={formData.phone} onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        {/* Фінансові операції */}
  {/* Тільки для дилера */}
        {formData.userType === "Dealer" && (
          <>
            <div className="sm:col-span-2 flex items-center space-x-2">
              <input type="checkbox" name="financialOperations" checked={formData.financialOperations} onChange={handleChange} />
              <label>Доступ до фінансових операцій</label>
            </div>

            <div className="sm:col-span-2 flex items-center space-x-2">
              <input type="checkbox" name="autoApprove" checked={formData.autoApprove} onChange={handleChange} />
              <label>Автозатвердження замовлень</label>
            </div>
          </>
        )}

        {/* Повідомлення */}
        {message && <p className="sm:col-span-2 text-center">{message}</p>}

        {/* Кнопка */}
        <div className="sm:col-span-2">
          <button type="submit" className="w-full bg-[#003d66] text-white py-2 px-4 rounded-md hover:bg-[#0055a5]">Зареєструвати</button>
        </div>
      </form>
    </div>
  );
};

export default RegisterUser;
