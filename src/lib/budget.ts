import type { Expense } from "@/data/tripData";
import type { SharedCurrency, SharedExpense } from "@/lib/sharedDataTypes";

export type CurrencySummary = {
  currency: "EUR" | "SGD";
  total: number;
  costPerPerson: number;
  paidByPerson: Record<string, number>;
  owedByPerson: Record<string, number>;
  balances: Record<string, number>;
  settlements: {
    from: string;
    to: string;
    amount: number;
    currency: "EUR" | "SGD";
  }[];
};

export type LedgerCurrencySummary = {
  currency: SharedCurrency;
  totalSpent: number;
  outstandingTotal: number;
  settledTotal: number;
  paidTotalByTraveler: Record<string, number>;
  shareTotalByTraveler: Record<string, number>;
  outstandingPaidByTraveler: Record<string, number>;
  outstandingShareByTraveler: Record<string, number>;
  netPositionByTraveler: Record<string, number>;
  settlements: {
    fromTravelerId: string;
    toTravelerId: string;
    amount: number;
    currency: SharedCurrency;
  }[];
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function formatMoney(amount: number, currency: "EUR" | "SGD") {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

export function summarizeBudget(
  expenses: Expense[],
  participants: string[]
): CurrencySummary[] {
  const currencies = Array.from(new Set(expenses.map((expense) => expense.currency)));

  return currencies.map((currency) => {
    const relevantExpenses = expenses.filter((expense) => expense.currency === currency);
    const paidByPerson = Object.fromEntries(
      participants.map((participant) => [participant, 0])
    ) as Record<string, number>;
    const owedByPerson = Object.fromEntries(
      participants.map((participant) => [participant, 0])
    ) as Record<string, number>;

    for (const expense of relevantExpenses) {
      paidByPerson[expense.paidBy] = roundMoney(
        (paidByPerson[expense.paidBy] ?? 0) + expense.amount
      );

      const share = expense.amount / expense.splitAmong.length;
      for (const participant of expense.splitAmong) {
        owedByPerson[participant] = roundMoney((owedByPerson[participant] ?? 0) + share);
      }
    }

    const total = roundMoney(
      relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    );
    const balances = Object.fromEntries(
      participants.map((participant) => [
        participant,
        roundMoney((paidByPerson[participant] ?? 0) - (owedByPerson[participant] ?? 0))
      ])
    ) as Record<string, number>;

    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < 0)
      .map(([name, balance]) => ({ name, amount: roundMoney(Math.abs(balance)) }));
    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0)
      .map(([name, balance]) => ({ name, amount: roundMoney(balance) }));

    const settlements: CurrencySummary["settlements"] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

      if (amount > 0) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount,
          currency
        });
      }

      debtor.amount = roundMoney(debtor.amount - amount);
      creditor.amount = roundMoney(creditor.amount - amount);

      if (debtor.amount <= 0.01) {
        debtorIndex += 1;
      }

      if (creditor.amount <= 0.01) {
        creditorIndex += 1;
      }
    }

    return {
      currency,
      total,
      costPerPerson: roundMoney(total / participants.length),
      paidByPerson,
      owedByPerson,
      balances,
      settlements
    };
  });
}

export function summarizeExpenseLedger(
  expenses: SharedExpense[],
  travelerIds: string[]
): LedgerCurrencySummary[] {
  const currencies = Array.from(new Set(expenses.map((expense) => expense.currency)));

  return currencies.map((currency) => {
    const relevantExpenses = expenses.filter((expense) => expense.currency === currency);
    const outstandingExpenses = relevantExpenses.filter((expense) => !expense.settled);
    const settledExpenses = relevantExpenses.filter((expense) => expense.settled);
    const paidTotalByTraveler = zeroByTraveler(travelerIds);
    const shareTotalByTraveler = zeroByTraveler(travelerIds);
    const outstandingPaidByTraveler = zeroByTraveler(travelerIds);
    const outstandingShareByTraveler = zeroByTraveler(travelerIds);

    for (const expense of relevantExpenses) {
      paidTotalByTraveler[expense.paidByTravelerId] = roundMoney(
        (paidTotalByTraveler[expense.paidByTravelerId] ?? 0) + expense.amount
      );

      const share = expense.amount / expense.splitTravelerIds.length;
      for (const travelerId of expense.splitTravelerIds) {
        shareTotalByTraveler[travelerId] = roundMoney((shareTotalByTraveler[travelerId] ?? 0) + share);
      }
    }

    for (const expense of outstandingExpenses) {
      outstandingPaidByTraveler[expense.paidByTravelerId] = roundMoney(
        (outstandingPaidByTraveler[expense.paidByTravelerId] ?? 0) + expense.amount
      );

      const share = expense.amount / expense.splitTravelerIds.length;
      for (const travelerId of expense.splitTravelerIds) {
        outstandingShareByTraveler[travelerId] = roundMoney(
          (outstandingShareByTraveler[travelerId] ?? 0) + share
        );
      }
    }

    const netPositionByTraveler = Object.fromEntries(
      travelerIds.map((travelerId) => [
        travelerId,
        roundMoney(
          (outstandingPaidByTraveler[travelerId] ?? 0) -
            (outstandingShareByTraveler[travelerId] ?? 0)
        )
      ])
    ) as Record<string, number>;

    return {
      currency,
      totalSpent: sumExpenses(relevantExpenses),
      outstandingTotal: sumExpenses(outstandingExpenses),
      settledTotal: sumExpenses(settledExpenses),
      paidTotalByTraveler,
      shareTotalByTraveler,
      outstandingPaidByTraveler,
      outstandingShareByTraveler,
      netPositionByTraveler,
      settlements: buildLedgerSettlements(netPositionByTraveler, currency)
    };
  });
}

function zeroByTraveler(travelerIds: string[]) {
  return Object.fromEntries(travelerIds.map((travelerId) => [travelerId, 0])) as Record<string, number>;
}

function sumExpenses(expenses: SharedExpense[]) {
  return roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0));
}

function buildLedgerSettlements(
  netPositionByTraveler: Record<string, number>,
  currency: SharedCurrency
): LedgerCurrencySummary["settlements"] {
  const debtors = Object.entries(netPositionByTraveler)
    .filter(([, balance]) => balance < 0)
    .map(([travelerId, balance]) => ({ travelerId, amount: roundMoney(Math.abs(balance)) }));
  const creditors = Object.entries(netPositionByTraveler)
    .filter(([, balance]) => balance > 0)
    .map(([travelerId, balance]) => ({ travelerId, amount: roundMoney(balance) }));
  const settlements: LedgerCurrencySummary["settlements"] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      settlements.push({
        fromTravelerId: debtor.travelerId,
        toTravelerId: creditor.travelerId,
        amount,
        currency
      });
    }

    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);

    if (debtor.amount <= 0.01) {
      debtorIndex += 1;
    }

    if (creditor.amount <= 0.01) {
      creditorIndex += 1;
    }
  }

  return settlements;
}
