// src/store/slices/permissionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {jwtDecode}  from 'jwt-decode'; // ✅ dùng default import

// Interface cho JWT claims
export interface TokenClaims {
  nameid: string;
  unique_name: string;
  role: string;
  Permission: (string | object)[]; // Có thể là string JSON hoặc object
  nbf: number;
  exp: number;
  iat: number;
}

// Interface cho parsed permissions
export interface ParsedPermission {
  id: string;
  ro: boolean;
  isenable: boolean; // true nếu có id (bật chức năng), false nếu không
}

export interface PermissionsState {
  token: string | null;
  claims: TokenClaims | null;
  parsedPermissions: { [key: string]: ParsedPermission } | null;
  isLoaded: boolean;
  error: string | null;
}

// Initial state
const initialState: PermissionsState = {
  token: null,
  claims: null,
  parsedPermissions: null,
  isLoaded: false,
  error: null,
};

// ✅ Helper function parse cả string JSON lẫn object
const parsePermissions = (permissions: (string | object)[]): { [key: string]: ParsedPermission } => {
  const parsed: { [key: string]: ParsedPermission } = {};
  permissions.forEach((perm) => {
    try {
      const permObj = typeof perm === "string" ? JSON.parse(perm) : perm;
      if (permObj.id) {
        parsed[permObj.id] = {
          id: permObj.id,
          ro: permObj.ro ?? false, // default full access nếu không có ro
          isenable: true,
        };
      } else {
        console.warn("Permission without id:", perm);
      }
    } catch (e) {
      console.error("Failed to parse permission:", perm, e);
    }
  });
  return parsed;
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    // Set token và decode
    setToken: (state, action: PayloadAction<string>) => {
      try {
        state.token = action.payload;
        const decoded = jwtDecode<TokenClaims>(action.payload);
        state.claims = decoded;
        state.parsedPermissions = parsePermissions(decoded.Permission || []);
        state.isLoaded = true;
        state.error = null;
      } catch (error) {
        state.error = 'Invalid token';
        state.isLoaded = false;
        console.error('Token decode error:', error);
      }
    },

    // Clear permissions (logout)
    clearPermissions: (state) => {
      state.token = null;
      state.claims = null;
      state.parsedPermissions = null;
      state.isLoaded = false;
      state.error = null;
    },

    // Update permissions manually (refresh token)
    updatePermissions: (
      state,
      action: PayloadAction<{ claims: TokenClaims; parsedPermissions: { [key: string]: ParsedPermission } }>
    ) => {
      state.claims = action.payload.claims;
      state.parsedPermissions = action.payload.parsedPermissions;
      state.isLoaded = true;
      state.error = null;
    },
  },
});

// Actions
export const { setToken, clearPermissions, updatePermissions } = permissionsSlice.actions;

// Selectors
export const selectToken = (state: any) => state.permissions?.token;
export const selectClaims = (state: any) => state.permissions?.claims;
export const selectParsedPermissions = (state: any) => state.permissions?.parsedPermissions;
export const selectIsLoaded = (state: any) => state.permissions?.isLoaded ?? false;
export const selectError = (state: any) => state.permissions?.error;
export const selectRole = (state: any) => state.permissions?.claims?.role;
export const selectIsAdmin = (state: any) => state.permissions?.claims?.role === 'ADMIN';

// ✅ Factory selector để dùng với useSelector
export const makeSelectHasPermission = (id: string, allowReadonly = false) =>
  (state: any) => {
    const perms = state.permissionSlice?.parsedPermissions; // ✅ match store key
    if (!perms) return false;

    const permObj = perms[id]; // already ParsedPermission object
    if (!permObj) return false;
    if (!permObj.isenable) return false;

    return allowReadonly ? true : !permObj.ro;
  };

export const selectHasPermission = makeSelectHasPermission;
// Reducer
export default permissionsSlice.reducer;
