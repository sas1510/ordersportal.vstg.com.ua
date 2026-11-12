// Verified contractor identity, independent of the displayed account name.
export const RIMINI_CONTRACTOR_GUID = '3dc6e0bc-5808-11f0-9b5a-90b11c14deb2';
export const isRiminiDealer = (user) => String(user?.user_id_1c || user?.user_id_1C || '').trim().toLowerCase() === RIMINI_CONTRACTOR_GUID;
