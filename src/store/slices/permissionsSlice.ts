import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {jwtDecode} from 'jwt-decode';

export interface TokenClaims {
  nameid: string;
  unique_name: string;
  role: string;
  Permission: (string | object)[];
  nbf: number;
  exp: number;
  iat: number;
}

export interface ParsedPermission {
  id: string;
  ro: boolean;
  isenable: boolean; // true nếu có id, false nếu không
}

export interface PermissionsState {
  token: string | null;
  claims: TokenClaims | null;
  parsedPermissions: { [key: string]: ParsedPermission } | null;
  isLoaded: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  token: null,
  claims: null,
  parsedPermissions: null,
  isLoaded: false,
  error: null,
};

// Parse cả string JSON lẫn object
const parsePermissions = (permissions: (string | object)[]): { [key: string]: ParsedPermission } => {
  const parsed: { [key: string]: ParsedPermission } = {};
  permissions.forEach((perm) => {
    try {
      const permObj = typeof perm === 'string' ? JSON.parse(perm) : perm;
      if (permObj.id) {
        parsed[permObj.id] = {
          id: permObj.id,
          ro: permObj.ro ?? false,
          isenable: true,
        };
      } else {
        console.warn('Permission without id:', perm);
      }
    } catch (e) {
      console.error('Failed to parse permission:', perm, e);
    }
  });
  return parsed;
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
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
    clearPermissions: (state) => {
      state.token = null;
      state.claims = null;
      state.parsedPermissions = null;
      state.isLoaded = false;
      state.error = null;
    },
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
export const selectParsedPermissions = (state: any) => state.permissions?.parsedPermissions;
export const selectToken = (state: any) => state.permissions?.token;
export const selectClaims = (state: any) => state.permissions?.claims;
export const selectIsLoaded = (state: any) => state.permissions?.isLoaded ?? false;
export const selectRole = (state: any) => state.permissions?.claims?.role;
export const selectIsAdmin = (state: any) => state.permissions?.claims?.role === 'ADMIN';

// Menu hiển thị (readonly vẫn hiện)
export const makeSelectCanDisplay = (id: string) => (state: any) => {
  const perms = state.permissions?.parsedPermissions;
  if (!perms) return false;
  const permObj = perms[id];
  if (!permObj) return false;
  return permObj.isenable;
};

// Có quyền thao tác (chỉ khi không readonly)
export const makeSelectCanEdit = (id: string) => (state: any) => {
  const perms = state.permissions?.parsedPermissions;
  if (!perms) return false;
  const permObj = perms[id];
  if (!permObj || !permObj.isenable) return false;
  return !permObj.ro;
};

// Lấy object permission đầy đủ
export const makeSelectPermission = (id: string) => (state: any) => {
  const perms = state.permissions?.parsedPermissions;
  if (!perms) return null;
  return perms[id] || null;
};

export default permissionsSlice.reducer;
