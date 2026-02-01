import { db } from "./firebase";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    deleteDoc,
    writeBatch
} from "firebase/firestore";

export interface UserSettings {
    goal: 'cut' | 'bulk' | 'maintain';
    activityLevel?: number; // Optional text description or multiplier
    // New Fields
    units: 'lb' | 'kg';
    startDate: string; // YYYY-MM-DD
    startingWeight: number;
    goalWeight: number;
    weeklyGoal: number; // e.g. -1.0 for lose 1lb/week
}

export interface DailyEntry {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    weight: number;
    calories: number;
    notes?: string;
    createdAt: string;
}

// User Helpers
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        return userDoc.data().settings as UserSettings;
    }
    return null;
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        settings: settings
    });
};

// Entry Helpers
export const addDailyEntry = async (userId: string, entry: Omit<DailyEntry, "userId" | "createdAt">) => {
    // Use date as doc ID to prevent duplicates for same day
    const entryId = `${userId}_${entry.date}`;
    await setDoc(doc(db, "entries", entryId), {
        ...entry,
        userId,
        createdAt: new Date().toISOString()
    });
};

export const getEntries = async (userId: string, days: number = 30): Promise<DailyEntry[]> => {
    const entriesRef = collection(db, "entries");
    const q = query(
        entriesRef,
        where("userId", "==", userId),
        orderBy("date", "desc"),
        limit(days)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyEntry));
};

export const deleteDailyEntry = async (entryId: string) => {
    await deleteDoc(doc(db, "entries", entryId));
};

export const updateDailyEntry = async (userId: string, originalEntry: DailyEntry, newEntry: Omit<DailyEntry, "userId" | "createdAt" | "id">) => {
    const oldId = originalEntry.id!;
    const newId = `${userId}_${newEntry.date}`;

    if (oldId === newId) {
        // Date didn't change, just update
        await updateDoc(doc(db, "entries", oldId), {
            ...newEntry
        });
    } else {
        // Date changed, move data
        const batch = writeBatch(db);
        const oldRef = doc(db, "entries", oldId);
        const newRef = doc(db, "entries", newId);

        batch.delete(oldRef);
        batch.set(newRef, {
            ...newEntry,
            userId,
            createdAt: originalEntry.createdAt // Preserve original creation time
        });

        await batch.commit();
    }
};
