import { getSitiesApi } from '@/api/skillSwapApi';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type CitiesState = {
  cities: Array<string>;
  loading: boolean;
  error?: string;
};

const initialState: CitiesState = {
  cities: [],
  loading: false,
};

export const getCities = createAsyncThunk<Array<string>>('cities/getAll', async () =>
  getSitiesApi(),
);

export const citiesSlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {},
  selectors: { getCitiesSelector: state => state.cities },
  extraReducers: builder => {
    builder
      .addCase(getCities.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(getCities.rejected, state => {
        state.loading = false;
        state.error = 'Не удалось загрузить данные о городах';
      })
      .addCase(getCities.fulfilled, (state, action) => {
        state.cities = action.payload;
        state.loading = false;
      });
  },
});

export const { getCitiesSelector } = citiesSlice.selectors;
export const citiesReducer = citiesSlice.reducer;
