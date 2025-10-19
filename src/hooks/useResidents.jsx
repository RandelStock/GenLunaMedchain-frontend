// hooks/useResidents.jsx
import { useState } from "react";
import api from "../../api";

export const useResidents = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getResidents = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params, excluding empty values
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const url = `/residents?${queryParams.toString()}`;
      const { data } = await api.get(url);
      console.log('Residents data:', data); // Debug log
      
      return data;
    } catch (err) {
      console.error('getResidents error:', err); // Debug log
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getResidentById = async (residentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get(`/residents/${residentId}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createResident = async (residentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.post(`/residents`, residentData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateResident = async (residentId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.put(`/residents/${residentId}`, updateData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteResident = async (residentId) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/residents/${residentId}`);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = async (barangay = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = barangay 
        ? `/residents/statistics?barangay=${barangay}`
        : `/residents/statistics`;
      const { data } = await api.get(url);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBarangayStatistics = async (barangay) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get(`/residents/statistics/barangay/${barangay}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getResidents,
    getResidentById,
    createResident,
    updateResident,
    deleteResident,
    getStatistics,
    getBarangayStatistics,
  };
};