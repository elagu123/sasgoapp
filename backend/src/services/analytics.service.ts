/**
 * Advanced Analytics Service
 * Provides comprehensive travel analytics and insights
 */

import prisma from '../lib/prisma';
import { getCacheService } from './cache.service';
import loggingService from './logging.service';
import type { Trip, Expense, User } from '@prisma/client';

export interface TravelAnalytics {
  userId: string;
  periodDays: number;
  totalTrips: number;
  completedTrips: number;
  upcomingTrips: number;
  totalExpenses: number;
  averageTripCost: number;
  averageTripDuration: number;
  preferredDestinations: DestinationPreference[];
  seasonalTrends: SeasonalData[];
  budgetAnalysis: BudgetAnalysis;
  travelEfficiency: EfficiencyMetrics;
  carbonFootprint: CarbonFootprintData;
  travelInsights: TravelInsight[];
}

export interface DestinationPreference {
  destination: string;
  visitCount: number;
  averageStay: number;
  totalSpent: number;
  satisfactionScore?: number;
  preferredSeason: string;
}

export interface SeasonalData {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  tripCount: number;
  averageSpent: number;
  destinations: string[];
  trendDirection: 'up' | 'down' | 'stable';
}

export interface BudgetAnalysis {
  budgetAccuracy: number; // Percentage of trips within budget
  averageBudgetOverrun: number;
  categoryBreakdown: CategorySpending[];
  savingsOpportunities: SavingsOpportunity[];
  spendingTrends: SpendingTrend[];
}

export interface CategorySpending {
  category: string;
  totalAmount: number;
  averagePerTrip: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SpendingTrend {
  period: string;
  amount: number;
  categoryBreakdown: { [category: string]: number };
}

export interface EfficiencyMetrics {
  planningToTravelRatio: number; // Days spent planning vs days traveling
  itineraryCompletionRate: number;
  packingEfficiency: number;
  timeOptimizationScore: number;
  satisfactionIndex: number;
}

export interface CarbonFootprintData {
  totalCO2Kg: number;
  averageCO2PerTrip: number;
  flightEmissions: number;
  accommodationEmissions: number;
  localTransportEmissions: number;
  offsetSuggestions: OffsetSuggestion[];
  comparisonToAverage: number; // Percentage compared to average traveler
}

export interface OffsetSuggestion {
  type: 'forest' | 'renewable' | 'local';
  cost: number;
  impact: string;
  provider: string;
}

export interface TravelInsight {
  type: 'tip' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'planning' | 'experience' | 'sustainability';
}

export interface TripComparison {
  tripId: string;
  comparedWith: string; // 'similar_trips' | 'user_average' | 'global_average'
  metrics: {
    costEfficiency: number;
    timeEfficiency: number;
    experienceRating: number;
    satisfactionScore: number;
  };
  improvements: string[];
}

export class AnalyticsService {
  private cache = getCacheService();
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Get comprehensive travel analytics for a user
   */
  async getUserTravelAnalytics(userId: string, periodDays: number = 365): Promise<TravelAnalytics> {
    const cacheKey = `analytics:user:${userId}:${periodDays}`;
    
    try {
      // Check cache first
      const cached = await this.cache.get<TravelAnalytics>(cacheKey);
      if (cached) {
        return cached;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Fetch user trips and expenses
      const [trips, expenses] = await Promise.all([
        this.getUserTripsInPeriod(userId, startDate, endDate),
        this.getUserExpensesInPeriod(userId, startDate, endDate)
      ]);

      // Calculate analytics
      const analytics: TravelAnalytics = {
        userId,
        periodDays,
        totalTrips: trips.length,
        completedTrips: trips.filter(t => t.endDate < new Date()).length,
        upcomingTrips: trips.filter(t => t.startDate > new Date()).length,
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        averageTripCost: this.calculateAverageTripCost(trips, expenses),
        averageTripDuration: this.calculateAverageTripDuration(trips),
        preferredDestinations: await this.analyzeDestinationPreferences(trips, expenses),
        seasonalTrends: this.analyzeSeasonalTrends(trips, expenses),
        budgetAnalysis: this.analyzeBudgetPerformance(trips, expenses),
        travelEfficiency: await this.calculateEfficiencyMetrics(userId, trips),
        carbonFootprint: this.calculateCarbonFootprint(trips, expenses),
        travelInsights: this.generateTravelInsights(trips, expenses)
      };

      // Cache the results
      await this.cache.set(cacheKey, analytics, this.CACHE_TTL);

      loggingService.info('Travel analytics calculated', {
        userId,
        periodDays,
        totalTrips: analytics.totalTrips,
        totalExpenses: analytics.totalExpenses
      });

      return analytics;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_user_travel_analytics',
        userId,
        periodDays
      });
      throw error;
    }
  }

  /**
   * Compare a trip with similar trips or averages
   */
  async getTripComparison(tripId: string, userId: string): Promise<TripComparison> {
    try {
      const trip = await prisma.trip.findFirst({
        where: { 
          id: tripId,
          OR: [
            { userId: userId },
            { sharedWith: { some: { userId: userId } } }
          ]
        },
        include: {
          expenses: true
        }
      });

      if (!trip) {
        throw new Error('Trip not found or access denied');
      }

      // Find similar trips for comparison
      const similarTrips = await this.findSimilarTrips(trip);
      
      // Calculate metrics
      const tripCost = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
      const tripDuration = this.calculateTripDuration(trip.startDate, trip.endDate);
      
      const similarTripsCost = similarTrips.length > 0 
        ? similarTrips.reduce((sum, t) => sum + (t.budget || 0), 0) / similarTrips.length
        : tripCost;

      const comparison: TripComparison = {
        tripId,
        comparedWith: 'similar_trips',
        metrics: {
          costEfficiency: this.calculateCostEfficiency(tripCost, similarTripsCost),
          timeEfficiency: this.calculateTimeEfficiency(trip, similarTrips),
          experienceRating: this.calculateExperienceRating(trip),
          satisfactionScore: this.calculateSatisfactionScore(trip)
        },
        improvements: this.generateImprovementSuggestions(trip, similarTrips)
      };

      return comparison;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_trip_comparison',
        tripId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get personalized travel recommendations based on analytics
   */
  async getPersonalizedRecommendations(userId: string): Promise<{
    destinationRecommendations: DestinationRecommendation[];
    budgetOptimizations: BudgetOptimization[];
    travelTips: PersonalizedTip[];
    seasonalSuggestions: SeasonalSuggestion[];
  }> {
    try {
      const analytics = await this.getUserTravelAnalytics(userId);
      
      return {
        destinationRecommendations: this.generateDestinationRecommendations(analytics),
        budgetOptimizations: this.generateBudgetOptimizations(analytics),
        travelTips: this.generatePersonalizedTips(analytics),
        seasonalSuggestions: this.generateSeasonalSuggestions(analytics)
      };
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_personalized_recommendations',
        userId
      });
      throw error;
    }
  }

  /**
   * Track user behavior for analytics improvement
   */
  async trackUserBehavior(userId: string, event: {
    type: string;
    data: any;
    timestamp?: Date;
  }): Promise<void> {
    try {
      // Store behavior data for analytics
      // This would typically go to a separate analytics database
      
      loggingService.info('User behavior tracked', {
        userId,
        eventType: event.type,
        timestamp: event.timestamp || new Date()
      });

      // Update real-time analytics if needed
      await this.updateRealTimeAnalytics(userId, event);
      
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'track_user_behavior',
        userId,
        eventType: event.type
      });
    }
  }

  // Private helper methods

  private async getUserTripsInPeriod(userId: string, startDate: Date, endDate: Date): Promise<Trip[]> {
    return prisma.trip.findMany({
      where: {
        OR: [
          { userId: userId },
          { sharedWith: { some: { userId: userId } } }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        expenses: true
      }
    });
  }

  private async getUserExpensesInPeriod(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return prisma.expense.findMany({
      where: {
        trip: {
          OR: [
            { userId: userId },
            { sharedWith: { some: { userId: userId } } }
          ]
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  private calculateAverageTripCost(trips: any[], expenses: Expense[]): number {
    if (trips.length === 0) return 0;
    
    const totalCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totalCost / trips.length;
  }

  private calculateAverageTripDuration(trips: Trip[]): number {
    if (trips.length === 0) return 0;
    
    const totalDuration = trips.reduce((sum, trip) => {
      return sum + this.calculateTripDuration(trip.startDate, trip.endDate);
    }, 0);
    
    return totalDuration / trips.length;
  }

  private calculateTripDuration(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async analyzeDestinationPreferences(trips: any[], expenses: Expense[]): Promise<DestinationPreference[]> {
    const destinationMap = new Map<string, {
      visitCount: number;
      totalStay: number;
      totalSpent: number;
    }>();

    trips.forEach(trip => {
      const destination = trip.destination;
      const stay = this.calculateTripDuration(trip.startDate, trip.endDate);
      const spent = trip.expenses?.reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0;

      if (destinationMap.has(destination)) {
        const current = destinationMap.get(destination)!;
        destinationMap.set(destination, {
          visitCount: current.visitCount + 1,
          totalStay: current.totalStay + stay,
          totalSpent: current.totalSpent + spent
        });
      } else {
        destinationMap.set(destination, {
          visitCount: 1,
          totalStay: stay,
          totalSpent: spent
        });
      }
    });

    return Array.from(destinationMap.entries()).map(([destination, data]) => ({
      destination,
      visitCount: data.visitCount,
      averageStay: data.totalStay / data.visitCount,
      totalSpent: data.totalSpent,
      preferredSeason: this.determinePreferredSeason(trips.filter(t => t.destination === destination))
    })).sort((a, b) => b.visitCount - a.visitCount);
  }

  private analyzeSeasonalTrends(trips: any[], expenses: Expense[]): SeasonalData[] {
    const seasonalData = {
      spring: { tripCount: 0, totalSpent: 0, destinations: new Set<string>() },
      summer: { tripCount: 0, totalSpent: 0, destinations: new Set<string>() },
      autumn: { tripCount: 0, totalSpent: 0, destinations: new Set<string>() },
      winter: { tripCount: 0, totalSpent: 0, destinations: new Set<string>() }
    };

    trips.forEach(trip => {
      const season = this.getSeason(trip.startDate);
      const spent = trip.expenses?.reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0;
      
      seasonalData[season].tripCount++;
      seasonalData[season].totalSpent += spent;
      seasonalData[season].destinations.add(trip.destination);
    });

    return Object.entries(seasonalData).map(([season, data]) => ({
      season: season as any,
      tripCount: data.tripCount,
      averageSpent: data.tripCount > 0 ? data.totalSpent / data.tripCount : 0,
      destinations: Array.from(data.destinations),
      trendDirection: 'stable' as const // Would calculate actual trend
    }));
  }

  private analyzeBudgetPerformance(trips: any[], expenses: Expense[]): BudgetAnalysis {
    const tripsWithBudget = trips.filter(t => t.budget);
    let budgetAccuracy = 0;
    let totalOverrun = 0;

    tripsWithBudget.forEach(trip => {
      const spent = trip.expenses?.reduce((sum: number, e: Expense) => sum + e.amount, 0) || 0;
      const budgetDiff = spent - trip.budget;
      
      if (budgetDiff <= 0) {
        budgetAccuracy++;
      } else {
        totalOverrun += budgetDiff;
      }
    });

    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    
    return {
      budgetAccuracy: tripsWithBudget.length > 0 ? (budgetAccuracy / tripsWithBudget.length) * 100 : 100,
      averageBudgetOverrun: tripsWithBudget.length > 0 ? totalOverrun / tripsWithBudget.length : 0,
      categoryBreakdown,
      savingsOpportunities: this.identifySavingsOpportunities(categoryBreakdown),
      spendingTrends: this.calculateSpendingTrends(expenses)
    };
  }

  private calculateCategoryBreakdown(expenses: Expense[]): CategorySpending[] {
    const categoryMap = new Map<string, number>();
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      totalAmount: amount,
      averagePerTrip: amount, // Would calculate per trip
      percentage: total > 0 ? (amount / total) * 100 : 0,
      trend: 'stable' as const
    }));
  }

  private async calculateEfficiencyMetrics(userId: string, trips: any[]): Promise<EfficiencyMetrics> {
    // This would calculate various efficiency metrics
    // For now, return mock data
    return {
      planningToTravelRatio: 2.5, // 2.5 days planning per day traveling
      itineraryCompletionRate: 85, // 85% of planned activities completed
      packingEfficiency: 78, // 78% of packed items used
      timeOptimizationScore: 82, // Overall time usage efficiency
      satisfactionIndex: 4.2 // Average satisfaction rating
    };
  }

  private calculateCarbonFootprint(trips: any[], expenses: Expense[]): CarbonFootprintData {
    // Simplified carbon footprint calculation
    let totalCO2 = 0;
    
    trips.forEach(trip => {
      const duration = this.calculateTripDuration(trip.startDate, trip.endDate);
      const distance = this.estimateDistance(trip.destination); // Would use actual calculation
      
      // Rough estimates (would use more accurate calculations)
      totalCO2 += distance * 0.12; // Flight emissions
      totalCO2 += duration * 50; // Accommodation emissions
      totalCO2 += duration * 20; // Local transport emissions
    });

    return {
      totalCO2Kg: totalCO2,
      averageCO2PerTrip: trips.length > 0 ? totalCO2 / trips.length : 0,
      flightEmissions: totalCO2 * 0.6,
      accommodationEmissions: totalCO2 * 0.3,
      localTransportEmissions: totalCO2 * 0.1,
      offsetSuggestions: this.generateOffsetSuggestions(totalCO2),
      comparisonToAverage: -15 // 15% below average
    };
  }

  private generateTravelInsights(trips: any[], expenses: Expense[]): TravelInsight[] {
    const insights: TravelInsight[] = [];

    // Budget insight
    if (expenses.length > 0) {
      const avgExpense = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
      if (avgExpense > 100) {
        insights.push({
          type: 'tip',
          title: 'Budget Optimization Opportunity',
          description: 'Your average expense per item is higher than similar travelers. Consider setting spending alerts.',
          actionable: true,
          priority: 'medium',
          category: 'budget'
        });
      }
    }

    // Planning insight
    if (trips.length > 0) {
      const completedTrips = trips.filter(t => t.endDate < new Date());
      if (completedTrips.length > 5) {
        insights.push({
          type: 'achievement',
          title: 'Experienced Traveler',
          description: `You've completed ${completedTrips.length} trips! You're becoming a travel expert.`,
          actionable: false,
          priority: 'low',
          category: 'experience'
        });
      }
    }

    return insights;
  }

  // Additional helper methods would be implemented here...

  private determinePreferredSeason(trips: any[]): string {
    const seasons = trips.map(t => this.getSeason(t.startDate));
    const seasonCounts = seasons.reduce((acc, season) => {
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return Object.keys(seasonCounts).reduce((a, b) => seasonCounts[a] > seasonCounts[b] ? a : b);
  }

  private getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private identifySavingsOpportunities(categoryBreakdown: CategorySpending[]): SavingsOpportunity[] {
    return categoryBreakdown
      .filter(category => category.percentage > 30) // Categories over 30% of budget
      .map(category => ({
        category: category.category,
        potentialSavings: category.totalAmount * 0.15, // 15% potential savings
        recommendation: `Consider alternative options for ${category.category} to reduce costs`,
        confidence: 'medium' as const
      }));
  }

  private calculateSpendingTrends(expenses: Expense[]): SpendingTrend[] {
    // Group expenses by month and calculate trends
    const monthlySpending = expenses.reduce((acc, expense) => {
      const month = expense.date.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, categories: {} as { [key: string]: number } };
      }
      acc[month].total += expense.amount;
      acc[month].categories[expense.category] = 
        (acc[month].categories[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as { [month: string]: { total: number; categories: { [key: string]: number } } });

    return Object.entries(monthlySpending).map(([period, data]) => ({
      period,
      amount: data.total,
      categoryBreakdown: data.categories
    }));
  }

  private async findSimilarTrips(trip: any): Promise<any[]> {
    // Find trips with similar characteristics
    return prisma.trip.findMany({
      where: {
        id: { not: trip.id },
        destination: { contains: trip.destination.split(',')[0] }, // Similar destination
        travelers: trip.travelers,
        // Add more similarity criteria
      },
      include: {
        expenses: true
      },
      take: 10
    });
  }

  private calculateCostEfficiency(tripCost: number, similarTripsCost: number): number {
    if (similarTripsCost === 0) return 100;
    return Math.max(0, ((similarTripsCost - tripCost) / similarTripsCost) * 100);
  }

  private calculateTimeEfficiency(trip: any, similarTrips: any[]): number {
    // Mock calculation - would implement actual time efficiency algorithm
    return 75;
  }

  private calculateExperienceRating(trip: any): number {
    // Mock calculation - would use actual user ratings and reviews
    return 4.2;
  }

  private calculateSatisfactionScore(trip: any): number {
    // Mock calculation - would use user feedback and behavior data
    return 4.5;
  }

  private generateImprovementSuggestions(trip: any, similarTrips: any[]): string[] {
    const suggestions = [];
    
    // Budget-based suggestions
    const tripCost = trip.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;
    const avgSimilarCost = similarTrips.length > 0 
      ? similarTrips.reduce((sum, t) => sum + (t.budget || 0), 0) / similarTrips.length
      : 0;
    
    if (tripCost > avgSimilarCost * 1.2) {
      suggestions.push('Consider budget accommodations to reduce costs');
      suggestions.push('Look for free activities and attractions');
    }

    // Duration-based suggestions
    const duration = this.calculateTripDuration(trip.startDate, trip.endDate);
    if (duration < 3) {
      suggestions.push('Consider extending your trip for better value');
    }

    return suggestions;
  }

  private generateDestinationRecommendations(analytics: TravelAnalytics): DestinationRecommendation[] {
    // Mock implementation - would use ML algorithms
    return [
      {
        destination: 'Barcelona, Spain',
        score: 0.92,
        reasons: ['Matches your preference for cultural cities', 'Similar budget to your past trips'],
        bestTime: 'April-May',
        estimatedCost: 1200
      }
    ];
  }

  private generateBudgetOptimizations(analytics: TravelAnalytics): BudgetOptimization[] {
    return analytics.budgetAnalysis.savingsOpportunities.map(opportunity => ({
      category: opportunity.category,
      currentSpending: 0, // Would calculate from analytics
      optimizedSpending: 0, // Would calculate optimized amount
      savings: opportunity.potentialSavings,
      recommendation: opportunity.recommendation
    }));
  }

  private generatePersonalizedTips(analytics: TravelAnalytics): PersonalizedTip[] {
    const tips: PersonalizedTip[] = [];

    if (analytics.carbonFootprint.totalCO2Kg > 1000) {
      tips.push({
        type: 'sustainability',
        title: 'Reduce Your Carbon Footprint',
        description: 'Consider offsetting your travel emissions or choosing closer destinations',
        actionUrl: '/sustainability/offsets'
      });
    }

    return tips;
  }

  private generateSeasonalSuggestions(analytics: TravelAnalytics): SeasonalSuggestion[] {
    const currentSeason = this.getSeason(new Date());
    const seasonalData = analytics.seasonalTrends.find(s => s.season === currentSeason);
    
    if (seasonalData && seasonalData.tripCount > 0) {
      return [{
        season: currentSeason,
        suggestion: `Based on your travel history, ${currentSeason} is a great time for you to visit ${seasonalData.destinations[0]}`,
        destinations: seasonalData.destinations,
        budgetRange: {
          min: seasonalData.averageSpent * 0.8,
          max: seasonalData.averageSpent * 1.2
        }
      }];
    }

    return [];
  }

  private generateOffsetSuggestions(totalCO2: number): OffsetSuggestion[] {
    return [
      {
        type: 'forest',
        cost: totalCO2 * 0.02, // $0.02 per kg CO2
        impact: `Plant ${Math.ceil(totalCO2 / 20)} trees`,
        provider: 'EcoForest Initiative'
      }
    ];
  }

  private estimateDistance(destination: string): number {
    // Mock distance calculation - would use actual geolocation
    return Math.floor(Math.random() * 5000) + 500;
  }

  private async updateRealTimeAnalytics(userId: string, event: any): Promise<void> {
    // Update real-time analytics cache
    const cacheKey = `realtime_analytics:${userId}`;
    // Implementation would update real-time metrics
  }
}

// Additional interfaces
interface DestinationRecommendation {
  destination: string;
  score: number;
  reasons: string[];
  bestTime: string;
  estimatedCost: number;
}

interface BudgetOptimization {
  category: string;
  currentSpending: number;
  optimizedSpending: number;
  savings: number;
  recommendation: string;
}

interface PersonalizedTip {
  type: string;
  title: string;
  description: string;
  actionUrl?: string;
}

interface SeasonalSuggestion {
  season: string;
  suggestion: string;
  destinations: string[];
  budgetRange: {
    min: number;
    max: number;
  };
}

// Export singleton instance
export const analyticsService = new AnalyticsService();