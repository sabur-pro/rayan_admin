// Типы данных для финансового конструктора

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export type SubscriptionType = 'yearly' | 'halfYearly' | 'monthly' | 'custom';
export type ExpenseCategory = 'server' | 'advertising' | 'salary' | 'tax' | 'other';

// Цены подписок
export const SUBSCRIPTION_PRICES: Record<Exclude<SubscriptionType, 'custom'>, number> = {
    yearly: 199.99,
    halfYearly: 99.99,
    monthly: 19.99,
};

// Названия подписок
export const SUBSCRIPTION_LABELS: Record<SubscriptionType, string> = {
    yearly: 'Годовая подписка',
    halfYearly: 'Полугодовая подписка',
    monthly: 'Месячная подписка',
    custom: 'Другое',
};

// Названия категорий расходов
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    server: 'Сервер/Хостинг',
    advertising: 'Реклама',
    salary: 'Зарплата',
    tax: 'Налог',
    other: 'Другое',
};

// Транзакция
export interface Transaction {
    id: string;
    type: TransactionType;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    accountId: string;
    // Для доходов
    subscriptionType?: SubscriptionType;
    // Для расходов
    category?: ExpenseCategory;
    createdAt: string;
}

// Банковский счёт
export interface Account {
    id: string;
    name: string;
    bank: string;
    balance: number;
    currency: string;
}

// Статистика
export interface FinanceStats {
    totalIncome: number;
    totalExpense: number;
    taxRate: number;
    taxAmount: number;
    netProfit: number;
    // Расшифровка по подпискам
    subscriptionBreakdown: {
        yearly: { count: number; total: number };
        halfYearly: { count: number; total: number };
        monthly: { count: number; total: number };
        custom: { count: number; total: number };
    };
    // Расходы по категориям
    expenseBreakdown: Record<ExpenseCategory, number>;
}

// Начальные счета
export const DEFAULT_ACCOUNTS: Account[] = [
    { id: 'acc-1', name: 'Основной счёт', bank: 'Душанбе Сити', balance: 0, currency: 'TJS' },
    { id: 'acc-2', name: 'Резервный счёт', bank: 'АлифБанк', balance: 0, currency: 'TJS' },
];

// Налоговая ставка
export const TAX_RATE = 0.06;
