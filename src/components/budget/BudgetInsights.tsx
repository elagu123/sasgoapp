import React from 'react';
import type { Expense, Trip } from '../../types';

interface BudgetInsightsProps {
  trip: Trip;
  expenses: Expense[];
  totalSpent: number; // in cents
}

const BudgetInsights: React.FC<BudgetInsightsProps> = ({ trip, expenses, totalSpent }) => {
  // Calculate insights
  const budgetInCents = trip.budget * 100;
  const remainingBudget = budgetInCents - totalSpent;
  const spentPercentage = (totalSpent / budgetInCents) * 100;
  
  // Calculate trip progress
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.min(Math.max(Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 0), totalDays);
  const tripProgressPercentage = (daysElapsed / totalDays) * 100;
  
  // Expense analysis by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)[0];
  
  // Daily spend rate
  const dailySpendRate = totalSpent / Math.max(daysElapsed, 1);
  const projectedSpend = dailySpendRate * totalDays;
  
  // Generate insights
  const insights = [];
  
  // Budget vs spending pace
  if (spentPercentage > tripProgressPercentage + 20) {
    insights.push({
      type: 'warning' as const,
      icon: '⚠️',
      title: 'Ritmo de gasto acelerado',
      description: `Has gastado ${spentPercentage.toFixed(0)}% del presupuesto en ${tripProgressPercentage.toFixed(0)}% del viaje. Considera reducir gastos para mantenerte dentro del presupuesto.`
    });
  } else if (spentPercentage < tripProgressPercentage - 20) {
    insights.push({
      type: 'success' as const,
      icon: '✅',
      title: 'Excelente control del presupuesto',
      description: `Vas por buen camino. Has gastado solo ${spentPercentage.toFixed(0)}% del presupuesto en ${tripProgressPercentage.toFixed(0)}% del viaje.`
    });
  }
  
  // Category insights
  if (topCategory) {
    const categoryNames = {
      alojamiento: 'Alojamiento',
      comida: 'Comida',
      transporte: 'Transporte',
      ocio: 'Ocio',
      compras: 'Compras',
      otros: 'Otros'
    };
    const categoryPercentage = (topCategory[1] / totalSpent) * 100;
    insights.push({
      type: 'info' as const,
      icon: '📊',
      title: 'Categoría principal de gastos',
      description: `${categoryNames[topCategory[0] as keyof typeof categoryNames]} representa ${categoryPercentage.toFixed(0)}% de tus gastos ($${(topCategory[1] / 100).toFixed(2)}).`
    });
  }
  
  // Projected spend warning
  if (projectedSpend > budgetInCents * 1.1) {
    insights.push({
      type: 'warning' as const,
      icon: '📈',
      title: 'Proyección de presupuesto excedido',
      description: `Al ritmo actual, podrías gastar $${(projectedSpend / 100).toFixed(2)} en total, superando tu presupuesto de $${trip.budget}.`
    });
  }
  
  // Daily budget recommendation
  const remainingDays = Math.max(totalDays - daysElapsed, 1);
  const dailyBudgetRecommendation = remainingBudget / remainingDays;
  
  if (dailyBudgetRecommendation > 0) {
    insights.push({
      type: 'tip' as const,
      icon: '💡',
      title: 'Presupuesto diario sugerido',
      description: `Para los próximos ${remainingDays} días, considera gastar máximo $${(dailyBudgetRecommendation / 100).toFixed(2)} por día.`
    });
  }
  
  if (insights.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
        🎯 Insights Inteligentes del Presupuesto
      </h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              insight.type === 'warning'
                ? 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-400'
                : insight.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-400'
                : insight.type === 'tip'
                ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-400'
                : 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-400'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-lg">{insight.icon}</span>
              <div>
                <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetInsights;