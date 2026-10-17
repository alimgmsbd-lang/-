export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  desc?: string;
  date: string;
}

export interface MarketItem {
  name: string;
  price: number;
}

export interface MarketList {
  id: number;
  shop: string;
  date: string;
  items: MarketItem[];
  total: number;
}

export interface Shop {
  name: string;
  addr?: string;
}

export interface DebtPerson {
  id: number;
  name: string;
  addr?: string;
  dir: 'give' | 'take'; // give: আমি পাবো (he owes me), take: সে পাবে (I owe him)
  amount: number;
}

export interface DebtHistory {
  id: number;
  relatedId: number;
  personId: number;
  name: string;
  amount: number;
  type: 'i_pay' | 'they_pay'; // i_pay: আমি শোধ করলাম (ব্যয়), they_pay: সে শোধ করলো (আয়)
  date: string;
}

export interface Budget {
  id: number;
  name: string;
  amount: number;
  target: string; // income_total | expense_total | market_general | shop_XYZ | others
  status: 'active' | 'completed';
}

export interface BillPayment {
  id: number;
  source: string;
  type: string;
  amount: number;
  date: string;
}

export interface UserProfile {
  name: string;
  img: string;
}

export interface ArchiveItem {
  id: number;
  name: string;
  data: {
    transactions: Transaction[];
    marketLists: MarketList[];
    shops: Shop[];
    debtPeople: DebtPerson[];
    debtHistory: DebtHistory[];
    budgets: Budget[];
    billPayments: BillPayment[];
  };
}
