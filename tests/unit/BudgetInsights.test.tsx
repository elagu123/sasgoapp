// Unit tests for BudgetInsights component

import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import BudgetInsights from '../../src/components/budget/BudgetInsights'
import type { Trip, Expense } from '../../src/types'
import { createMockTrip } from '../../src/test/setup'

describe('BudgetInsights Component', () => {
  let mockTrip: Trip
  let mockExpenses: Expense[]

  beforeEach(() => {
    mockTrip = {
      ...createMockTrip(),
      budget: 1000,
      dates: {
        start: '2024-01-01',
        end: '2024-01-10' // 10 day trip
      }
    }
    
    mockExpenses = [
      {
        id: '1',
        tripId: mockTrip.id,
        description: 'Hotel',
        amount: 30000, // $300 in cents
        category: 'alojamiento',
        date: '2024-01-02',
        createdBy: 'user1',
        createdAt: '2024-01-02T10:00:00Z'
      },
      {
        id: '2',
        tripId: mockTrip.id,
        description: 'Restaurant',
        amount: 15000, // $150 in cents
        category: 'comida',
        date: '2024-01-03',
        createdBy: 'user1',
        createdAt: '2024-01-03T19:00:00Z'
      }
    ]
  })

  it('renders budget insights with spending analysis', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={mockExpenses}
        totalSpent={45000} // $450 in cents
      />
    )

    // Should show the insights header
    expect(screen.getByText('🎯 Insights Inteligentes del Presupuesto')).toBeInTheDocument()
    
    // Should display spending percentage insights
    expect(screen.getByText(/Has gastado.*% del presupuesto/)).toBeInTheDocument()
  })

  it('shows warning when spending is too fast', () => {
    // Create a scenario with high spending early in trip
    const highSpendingExpenses = [
      ...mockExpenses,
      {
        id: '3',
        tripId: mockTrip.id,
        description: 'Expensive activity',
        amount: 40000, // $400
        category: 'ocio',
        date: '2024-01-02',
        createdBy: 'user1',
        createdAt: '2024-01-02T15:00:00Z'
      }
    ]

    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={highSpendingExpenses}
        totalSpent={85000} // $850 spent, 85% of $1000 budget
      />
    )

    expect(screen.getByText('Ritmo de gasto acelerado')).toBeInTheDocument()
    expect(screen.getByText(/Considera reducir gastos/)).toBeInTheDocument()
  })

  it('shows success message when budget is well controlled', () => {
    // Mock dates to simulate we're halfway through the trip
    const mockTripHalfway = {
      ...mockTrip,
      dates: {
        start: '2023-12-20', // Started 20 days ago
        end: '2024-01-20'    // Ends in 10 days (halfway point)
      }
    }

    render(
      <BudgetInsights 
        trip={mockTripHalfway}
        expenses={mockExpenses}
        totalSpent={25000} // $250, only 25% of budget spent at halfway point
      />
    )

    expect(screen.getByText('Excelente control del presupuesto')).toBeInTheDocument()
  })

  it('displays category breakdown insights', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={mockExpenses}
        totalSpent={45000}
      />
    )

    // Should show which category is the highest
    expect(screen.getByText('Categoría principal de gastos')).toBeInTheDocument()
    expect(screen.getByText(/Alojamiento representa.*% de tus gastos/)).toBeInTheDocument()
  })

  it('shows daily budget recommendation', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={mockExpenses}
        totalSpent={45000}
      />
    )

    expect(screen.getByText('Presupuesto diario sugerido')).toBeInTheDocument()
    expect(screen.getByText(/considera gastar máximo.*por día/)).toBeInTheDocument()
  })

  it('warns about budget projection excess', () => {
    // High daily spending rate that would exceed budget
    const highSpendingExpenses = mockExpenses.map(expense => ({
      ...expense,
      amount: expense.amount * 3 // Triple the spending
    }))

    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={highSpendingExpenses}
        totalSpent={135000} // $1350, already exceeding budget
      />
    )

    expect(screen.getByText('Proyección de presupuesto excedido')).toBeInTheDocument()
    expect(screen.getByText(/Al ritmo actual.*podrías gastar/)).toBeInTheDocument()
  })

  it('handles edge case with no expenses', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={[]}
        totalSpent={0}
      />
    )

    // Should show daily budget recommendation even with no expenses
    expect(screen.getByText('Presupuesto diario sugerido')).toBeInTheDocument()
  })

  it('handles zero budget gracefully', () => {
    const zeroBudgetTrip = { ...mockTrip, budget: 0 }
    
    render(
      <BudgetInsights 
        trip={zeroBudgetTrip}
        expenses={mockExpenses}
        totalSpent={45000}
      />
    )

    // Component should not crash and handle division by zero
    expect(screen.getByText('🎯 Insights Inteligentes del Presupuesto')).toBeInTheDocument()
  })

  it('displays insights with correct styling classes', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={mockExpenses}
        totalSpent={45000}
      />
    )

    // Check for proper container styling
    const container = screen.getByText('🎯 Insights Inteligentes del Presupuesto').closest('div')
    expect(container).toHaveClass('bg-gradient-to-r', 'from-blue-50', 'to-purple-50')
  })

  it('formats currency amounts correctly', () => {
    render(
      <BudgetInsights 
        trip={mockTrip}
        expenses={mockExpenses}
        totalSpent={45000}
      />
    )

    // Should display formatted dollar amounts
    expect(screen.getByText(/\$\d+\.\d{2}/)).toBeInTheDocument()
  })
})