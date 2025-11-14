import React, { useState } from 'react';
import { FaUserEdit, FaLock, FaSave, FaKey } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
// import axiosInstance from '../api/axios'; 

const DealerProfile = () => {
    const { addNotification } = useNotification();

    // 1. Стан особистих даних
    const [profileData, setProfileData] = useState({
        fullName: 'Іваненко Іван Іванович',
        email: 'ivanenko@dealer.ua',
        phone: '+380 99 123 4567',
        company: 'ТОВ "Буд-Експерт"',
        address: 'м. Київ, вул. Перемоги, 15',
    });
    const [loadingProfile, setLoadingProfile] = useState(false);

    // 2. Стан зміни пароля
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Визначаємо, чи активна темна тема
    const isDarkTheme = document.body.classList.contains('dark-theme');

    // === Умовні стилі для Темної Теми ===
    const darkStyles = {
        windowBg: isDarkTheme ? '#2b2b2b' : '#fff',
        windowShadow: isDarkTheme ? '0 10px 30px rgba(0, 0, 0, 0.7)' : '0 10px 30px rgba(0, 0, 0, 0.25)',
        profileHeaderBg: 'linear-gradient(90deg, #1d4ed8, #3b82f6)', // Синій градієнт
        passwordHeaderBg: 'linear-gradient(90deg, #d97706, #f59e0b)', // Помаранчевий градієнт
        buttonPrimaryBg: isDarkTheme ? '#3b82f6' : '#3b82f6', // Синя кнопка
        divider: {
            borderTop: `1px solid ${isDarkTheme ? '#444' : '#eee'}`,
            margin: '30px 0',
        },
    };


    // === Обробка зміни даних профілю ===
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            addNotification('Особисті дані успішно оновлено!', 'success');
        } catch (error) {
            addNotification('Помилка оновлення даних', 'error');
        } finally {
            setLoadingProfile(false);
        }
    };

    // === Обробка зміни пароля ===
    const handlePasswordDataChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { newPassword, confirmNewPassword } = passwordData;

        if (newPassword !== confirmNewPassword) {
            return addNotification('Новий пароль та підтвердження не збігаються!', 'error');
        }
        if (newPassword.length < 8) {
            return addNotification('Пароль повинен містити мінімум 8 символів', 'error');
        }
        
        setLoadingPassword(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            addNotification('Пароль успішно змінено!', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error) {
            addNotification('Помилка зміни пароля. Перевірте поточний пароль.', 'error');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <div className="file-body column gap-14">
            
            {/* ========================================================= */}
            {/* 1. Блок зміни особистих даних */}
            {/* ========================================================= */}
            <div className="file-modal-window" style={{ 
                maxWidth: '800px', 
                padding: '30px', 
                margin: '0 auto',
                background: darkStyles.windowBg,
                boxShadow: darkStyles.windowShadow,
            }}>
                <div className="file-modal-header" style={{ background: darkStyles.profileHeaderBg }}>
                    <div className="header-content">
                        <div className="file-icon"><FaUserEdit /></div>
                        <h3>Особиста інформація дилера</h3>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="file-form" style={{ overflow: 'visible', padding: '20px' }}>
                    
                    {/* Поля форми (використовують адаптовані класи .file-label та .file-input) */}
                    <label className="file-label">
                        <span>П.І.Б.</span>
                        <input type="text" name="fullName" value={profileData.fullName} onChange={handleProfileChange} className="file-input" required/>
                    </label>

                    <label className="file-label">
                        <span>Компанія</span>
                        <input type="text" name="company" value={profileData.company} onChange={handleProfileChange} className="file-input"/>
                    </label>
                    
                    <div className="file-row">
                        <label className="file-label">
                            <span>Email</span>
                            <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className="file-input" required/>
                        </label>
                        <label className="file-label">
                            <span>Телефон</span>
                            <input type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} className="file-input" required/>
                        </label>
                    </div>

                    <label className="file-label">
                        <span>Адреса</span>
                        <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} className="file-input"/>
                    </label>

                    <div className="file-modal-footer" style={{ borderTop: darkStyles.divider.borderTop, justifyContent: 'flex-end', padding: '10px 0' }}>
                        <button type="submit" className="file-btn-save" disabled={loadingProfile} style={{ background: darkStyles.buttonPrimaryBg }}>
                            {loadingProfile ? <div className="loader-small" /> : <FaSave />} Зберегти зміни
                        </button>
                    </div>
                </form>
            </div>
            
            
            {/* Роздільник */}
            <div style={darkStyles.divider} />


            {/* ========================================================= */}
            {/* 2. Блок зміни пароля */}
            {/* ========================================================= */}
            <div className="file-modal-window" style={{ 
                maxWidth: '800px', 
                padding: '30px', 
                margin: '0 auto',
                background: darkStyles.windowBg,
                boxShadow: darkStyles.windowShadow,
            }}>
                <div className="file-modal-header" style={{ background: darkStyles.passwordHeaderBg }}>
                    <div className="header-content">
                        <div className="file-icon"><FaLock /></div>
                        <h3>Зміна пароля</h3>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="file-form" style={{ overflow: 'visible', padding: '20px' }}>
                    
                    <label className="file-label">
                        <span>Поточний пароль</span>
                        <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordDataChange} className="file-input" required/>
                    </label>

                    <label className="file-label">
                        <span>Новий пароль</span>
                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} className="file-input" required/>
                    </label>
                    
                    <label className="file-label">
                        <span>Підтвердження нового пароля</span>
                        <input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordDataChange} className="file-input" required/>
                    </label>

                    <div className="file-modal-footer" style={{ borderTop: darkStyles.divider.borderTop, justifyContent: 'flex-end', padding: '10px 0' }}>
                        <button type="submit" className="file-btn-save" disabled={loadingPassword}>
                            {loadingPassword ? <div className="loader-small" /> : <FaKey />} Змінити пароль
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DealerProfile;