
type FilterState = {
    activeKpi: string | null;
    searchQuery: string;
};

type Listener = () => void;

class DashboardFilterStore {
    private state: FilterState = {
        activeKpi: null,
        searchQuery: '',
    };
    private listeners: Set<Listener> = new Set();

    getState = (): FilterState => {
        return this.state;
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify = () => {
        this.listeners.forEach(listener => listener());
    }

    setActiveKpi = (kpi: string | null) => {
        // If clicking the same KPI, toggle it off
        if (this.state.activeKpi === kpi) {
            this.state = { ...this.state, activeKpi: null };
        } else {
            this.state = { ...this.state, activeKpi: kpi };
        }
        this.notify();
    }
    
    setSearchQuery = (query: string) => {
        this.state = { ...this.state, searchQuery: query };
        this.notify();
    }

    clearFilters = () => {
        this.state = { activeKpi: null, searchQuery: '' };
        this.notify();
    }
}

export const dashboardFilterStore = new DashboardFilterStore();