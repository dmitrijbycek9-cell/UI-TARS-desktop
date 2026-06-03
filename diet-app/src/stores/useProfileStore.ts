import { create } from 'zustand';
import { db } from '@/db/db';
import { computeProfile, type ProfileInput } from '@/lib/health';
import type { UserProfile } from '@/types';

interface ProfileState {
  profile: UserProfile | null;
  loaded: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<UserProfile>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loaded: false,
  async loadProfile() {
    const profile = (await db.profile.get('me')) ?? null;
    set({ profile, loaded: true });
  },
  async saveProfile(input) {
    const profile = computeProfile(input);
    await db.profile.put(profile);
    set({ profile });
    return profile;
  },
}));
