"use client";

import { useState, useEffect } from "react";
import AdminProtection from "../../components/AdminProtection/AdminProtection";
import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface Stage {
  id: number;
  name: string;
  period: string;
  yau: string;
  months: number;
  tickets: number;
  avgPrice: number;
  monthlyOpCost: number;
  monthlyTechCost: number;
  defaultCommission: string;
  defaultProfitShare: string;
}

interface StageInputs {
  commission: string;
  share: string;
}

const INITIAL_INVESTMENT = -75000;

const STAGES: Stage[] = [
  {
    id: 1,
    name: 'שלב 1 – "אפס חיכוך"',
    period: "6 - 0 חודשים",
    yau: "2K ≈ 0.2%",
    months: 6,
    tickets: 400,
    avgPrice: 100,
    monthlyOpCost: 130,
    monthlyTechCost: 0,
    defaultCommission: "0",
    defaultProfitShare: "0",
  },
  {
    id: 2,
    name: 'שלב 2 – "נחיתה רכה"',
    period: "18 - 7 חודשים",
    yau: "60K ≈ 15%",
    months: 12,
    tickets: 10000,
    avgPrice: 150,
    monthlyOpCost: 1100,
    monthlyTechCost: 3000,
    defaultCommission: "2",
    defaultProfitShare: "30",
  },
  {
    id: 3,
    name: 'שלב 3 – "ביסוס רווחיות"',
    period: "36 - 19 חודשים",
    yau: "500K ≈ 80%",
    months: 18,
    tickets: 95833,
    avgPrice: 190,
    monthlyOpCost: 6500,
    monthlyTechCost: 12000,
    defaultCommission: "7",
    defaultProfitShare: "30",
  },
];

export default function PnLCalculator() {
  const [stageInputs, setStageInputs] = useState<Record<number, StageInputs>>(
    {}
  );
  const [cumulativePnL, setCumulativePnL] = useState(INITIAL_INVESTMENT);

  useEffect(() => {
    // Initialize with default values
    const initialInputs: Record<number, StageInputs> = {};
    STAGES.forEach((stage) => {
      initialInputs[stage.id] = {
        commission: stage.defaultCommission,
        share: stage.defaultProfitShare,
      };
    });
    setStageInputs(initialInputs);
  }, []);

  useEffect(() => {
    if (Object.keys(stageInputs).length > 0) {
      calculate();
    }
  }, [stageInputs]);

  const handleInputChange = (
    stageId: number,
    field: "commission" | "share",
    value: string
  ) => {
    setStageInputs((prev) => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value,
      },
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
    }).format(Math.round(value));
  };

  const calculate = () => {
    let accumulatedPnL = INITIAL_INVESTMENT;

    STAGES.forEach((stage) => {
      const inputs = stageInputs[stage.id];
      if (!inputs) return;

      const commValue = parseFloat(inputs.commission);
      const shareValue = parseFloat(inputs.share);

      const commissionRate =
        isNaN(commValue) || commValue < 0 ? 0 : commValue / 100;
      const profitShareRate =
        isNaN(shareValue) || shareValue < 0 ? 0 : shareValue / 100;

      const monthlyTotalRevenue = stage.tickets * stage.avgPrice;
      const monthlyCommissionIncomeGross = monthlyTotalRevenue * commissionRate;
      const monthlyProducerPayout =
        monthlyCommissionIncomeGross * profitShareRate;
      const monthlyCommissionIncomeNet =
        monthlyCommissionIncomeGross - monthlyProducerPayout;
      const monthlyTotalExpenses = stage.monthlyOpCost + stage.monthlyTechCost;
      const monthlyPnL = monthlyCommissionIncomeNet - monthlyTotalExpenses;
      const stagePnL = monthlyPnL * stage.months;

      accumulatedPnL += stagePnL;
    });

    setCumulativePnL(accumulatedPnL);
  };

  const calculateStageResults = (stage: Stage) => {
    const inputs = stageInputs[stage.id];
    if (!inputs) return null;

    const commValue = parseFloat(inputs.commission);
    const shareValue = parseFloat(inputs.share);

    const commissionRate =
      isNaN(commValue) || commValue < 0 ? 0 : commValue / 100;
    const profitShareRate =
      isNaN(shareValue) || shareValue < 0 ? 0 : shareValue / 100;

    const monthlyTotalRevenue = stage.tickets * stage.avgPrice;
    const monthlyCommissionIncomeGross = monthlyTotalRevenue * commissionRate;
    const monthlyProducerPayout =
      monthlyCommissionIncomeGross * profitShareRate;
    const stageProducerPayout = monthlyProducerPayout * stage.months;
    const monthlyCommissionIncomeNet =
      monthlyCommissionIncomeGross - monthlyProducerPayout;
    const monthlyTotalExpenses = stage.monthlyOpCost + stage.monthlyTechCost;
    const monthlyPnL = monthlyCommissionIncomeNet - monthlyTotalExpenses;

    const stageCommissionIncomeGross =
      monthlyCommissionIncomeGross * stage.months;
    const stageCommissionIncomeNet = monthlyCommissionIncomeNet * stage.months;
    const stageOperatingCost = stage.monthlyOpCost * stage.months;
    const stageTechCost = stage.monthlyTechCost * stage.months;
    const stagePnL = monthlyPnL * stage.months;

    let cumulativeForStage = INITIAL_INVESTMENT;
    for (let i = 0; i < STAGES.length; i++) {
      if (STAGES[i].id > stage.id) break;

      const stageInputsTemp = stageInputs[STAGES[i].id];
      if (!stageInputsTemp) continue;

      const commTemp = parseFloat(stageInputsTemp.commission) / 100 || 0;
      const shareTemp = parseFloat(stageInputsTemp.share) / 100 || 0;
      const monthlyRevTemp = STAGES[i].tickets * STAGES[i].avgPrice;
      const monthlyCommGrossTemp = monthlyRevTemp * commTemp;
      const monthlyProdPayoutTemp = monthlyCommGrossTemp * shareTemp;
      const monthlyCommNetTemp = monthlyCommGrossTemp - monthlyProdPayoutTemp;
      const monthlyExpTemp =
        STAGES[i].monthlyOpCost + STAGES[i].monthlyTechCost;
      const monthlyPnLTemp = monthlyCommNetTemp - monthlyExpTemp;
      const stagePnLTemp = monthlyPnLTemp * STAGES[i].months;

      cumulativeForStage += stagePnLTemp;
    }

    return {
      monthlyCommissionIncomeGross,
      stageCommissionIncomeGross,
      monthlyCommissionIncomeNet,
      stageCommissionIncomeNet,
      monthlyProducerPayout,
      stageProducerPayout,
      stageOperatingCost,
      stageTechCost,
      monthlyPnL,
      stagePnL,
      cumulativePnL: cumulativeForStage,
    };
  };

  const formatValue = (value: number) => {
    const className = value >= 0 ? "text-green-600" : "text-primary";
    return (
      <span className={`text-lg font-bold ${className}`}>
        {formatCurrency(value)}
      </span>
    );
  };

  const formatExpense = (value: number) => {
    return (
      <span className="text-lg font-bold text-red-600">
        {formatCurrency(value)}
      </span>
    );
  };

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50">
        <NavBar />

        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10">
          {/* Header */}
          <header className="bg-white p-6 rounded-xl shadow-lg border-t-8 border-primary">
            <div className="flex flex-col items-center">
              <p className="text-4xl font-extrabold text-red-600 mb-1">L</p>
              <h1 className="text-2xl font-bold text-gray-700 mb-4">
                מחשבון P&L עסקי רב-שלבי
              </h1>
              <p className="text-center text-gray-500 mb-6">
                כלי תחזית כלכלית לפרויקט TIKET +
              </p>
            </div>

            {/* Initial Investment */}
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-300 text-center">
              <p className="font-bold text-primary text-lg">
                השקעה ראשונית (עלות שיווק):
              </p>
              <p className="text-3xl font-extrabold text-red-900 mt-1">
                {formatCurrency(INITIAL_INVESTMENT)}
              </p>
            </div>
          </header>

          {/* Cumulative P&L */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-md">
            <h2 className="text-xl font-extrabold text-red-600 mb-3">
              P&L מצטבר כולל (עד סוף תקופה)
            </h2>
            <div className="text-center">
              <span
                className={`text-4xl font-extrabold ${
                  cumulativePnL >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(cumulativePnL)}
              </span>
            </div>
          </section>

          {/* Stage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STAGES.map((stage) => {
              const results = calculateStageResults(stage);
              if (!results) return null;

              const inputs = stageInputs[stage.id] || {
                commission: stage.defaultCommission,
                share: stage.defaultProfitShare,
              };

              return (
                <div
                  key={stage.id}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
                >
                  {/* Period and Title */}
                  <div className="text-center mb-6">
                    <p className="text-sm font-light text-red-600 mb-1">
                      תקופה: {stage.period}
                    </p>
                    <h2 className="text-2xl font-extrabold text-gray-800">
                      {stage.name}
                    </h2>
                  </div>

                  {/* Parameters and Inputs */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                    {/* Commission Rate */}
                    <div className="text-center">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        עמלה מהלקוח
                      </label>
                      <div className="relative w-2/3 mx-auto">
                        <input
                          type="number"
                          value={inputs.commission}
                          min="0"
                          max="100"
                          className="w-full p-2 pr-11 border border-gray-300 bg-white text-gray-800 rounded-md focus:ring-red-500 focus:border-red-500 text-base text-right font-bold"
                          onChange={(e) =>
                            handleInputChange(
                              stage.id,
                              "commission",
                              e.target.value
                            )
                          }
                        />
                        <span className="absolute inset-y-0 right-1 flex items-center text-gray-600 text-base font-bold">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Profit Share */}
                    <div className="text-center">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        אחוז למפיקים
                      </label>
                      <div className="relative w-2/3 mx-auto">
                        <input
                          type="number"
                          value={inputs.share}
                          min="0"
                          max="100"
                          className="w-full p-2 pr-11 border border-gray-300 bg-white text-gray-800 rounded-md focus:ring-red-500 focus:border-red-500 text-base text-right font-bold"
                          onChange={(e) =>
                            handleInputChange(stage.id, "share", e.target.value)
                          }
                        />
                        <span className="absolute inset-y-0 right-1 flex items-center text-gray-600 text-base font-bold">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Tickets per month */}
                    <div className="text-center mt-4">
                      <p className="text-sm font-medium text-gray-500">
                        כרטיסים לחודש
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {stage.tickets.toLocaleString("he-IL")}
                      </p>
                    </div>

                    {/* Average price */}
                    <div className="text-center mt-4">
                      <p className="text-sm font-medium text-gray-500">
                        ממוצע לכרטיס
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(stage.avgPrice)}
                      </p>
                    </div>

                    {/* YAU */}
                    <div className="col-span-2 text-center mt-4">
                      <p className="text-sm font-medium text-gray-500">YAU</p>
                      <p className="text-lg font-bold text-gray-800">
                        {stage.yau} YAU
                      </p>
                    </div>
                  </div>

                  {/* P&L Results */}
                  <div className="grid grid-cols-2 gap-y-4">
                    {/* Gross Income */}
                    <div className="text-right space-y-1 border-b border-gray-100 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        הכנסה חודשית (ברוטו)
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {formatCurrency(results.monthlyCommissionIncomeGross)}
                      </p>
                    </div>
                    <div className="text-left space-y-1 border-b border-gray-100 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        הכנסה שלבית (ברוטו)
                      </p>
                      <p className="text-base font-semibold text-gray-800">
                        {formatCurrency(results.stageCommissionIncomeGross)}
                      </p>
                    </div>

                    {/* Producer Payout */}
                    <div className="text-right space-y-1 border-b border-gray-100 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        רווח מפיקים חודשי
                      </p>
                      {formatExpense(results.monthlyProducerPayout)}
                    </div>
                    <div className="text-left space-y-1 border-b border-gray-100 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        רווח מפיקים שלבי
                      </p>
                      {formatExpense(results.stageProducerPayout)}
                    </div>

                    {/* Net Profit */}
                    <div className="text-right space-y-1 border-b-2 border-red-300 pt-3 pb-3">
                      <p className="font-bold text-gray-800">רווח נטו חודשי</p>
                      {formatValue(results.monthlyCommissionIncomeNet)}
                    </div>
                    <div className="text-left space-y-1 border-b-2 border-red-300 pt-3 pb-3">
                      <p className="font-bold text-gray-800">רווח נטו שלבי</p>
                      {formatValue(results.stageCommissionIncomeNet)}
                    </div>

                    {/* Operating Cost */}
                    <div className="text-right space-y-1 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        עלות תפעול חודשית
                      </p>
                      {formatExpense(stage.monthlyOpCost)}
                    </div>
                    <div className="text-left space-y-1 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        עלות תפעול שלבית
                      </p>
                      {formatExpense(results.stageOperatingCost)}
                    </div>

                    {/* Tech Support */}
                    <div className="text-right space-y-1 border-b border-gray-100 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        תמיכה טכנית חודשית
                      </p>
                      {formatExpense(stage.monthlyTechCost)}
                    </div>
                    <div className="text-left space-y-1 border-b border-gray-100 pt-3 pb-3">
                      <p className="text-sm font-medium text-gray-500">
                        תמיכה טכנית שלבית
                      </p>
                      {formatExpense(results.stageTechCost)}
                    </div>

                    {/* P&L Bottom Line */}
                    <div className="text-right space-y-1 pt-4">
                      <p className="text-lg font-extrabold text-gray-800">
                        P&L חודשי
                      </p>
                      {formatValue(results.monthlyPnL)}
                    </div>
                    <div className="text-left space-y-1 pt-4">
                      <p className="text-lg font-extrabold text-gray-800">
                        P&L שלבי
                      </p>
                      {formatValue(results.stagePnL)}
                    </div>
                  </div>

                  {/* Cumulative P&L for Stage */}
                  <div className="text-center mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-lg font-extrabold text-gray-600 mb-1">
                      P&L מצטבר
                    </p>
                    <span
                      className={`text-3xl font-extrabold ${
                        results.cumulativePnL >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(results.cumulativePnL)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Footer />
      </div>
    </AdminProtection>
  );
}
