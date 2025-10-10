import { create } from "zustand";

interface relativeState {
    selectedPlaceName: string;
    setSelectedPlaceName: (name: string) => void;
}

const useRelativeStore = create<relativeState>((set) => ({
    selectedPlaceName: '',
    setSelectedPlaceName: (name) => set({ selectedPlaceName: name}),
}));

export default useRelativeStore;