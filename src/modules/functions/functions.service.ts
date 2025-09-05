import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FunctionsService {
  private availableFunctions: { [key: string]: (args: any) => Promise<any> };
  private readonly PROPERTY_API_BASE_URL: string;

  constructor(private readonly configService: ConfigService) {
    this.PROPERTY_API_BASE_URL =
      this.configService.get<string>('PROPERTY_API_BASE_URL') ||
      'http://localhost:3000/api/v1';
    this.availableFunctions = {
      fetchUserData: this.fetchUserData.bind(this) as (
        args: any,
      ) => Promise<any>,
      searchProduct: this.searchProduct.bind(this) as (
        args: any,
      ) => Promise<any>,
      searchProperties: this.searchProperties.bind(this) as (
        args: any,
      ) => Promise<any>,
      getAvailableLocalities: this.getAvailableLocalities.bind(this) as (
        args: any,
      ) => Promise<any>,
    };
  }

  async callFunction(name: string, args: any): Promise<any> {
    const func = this.availableFunctions[name];
    if (!func) {
      throw new Error(`Function ${name} not found.`);
    }
    return await func(args);
  }

  private async fetchUserData(args: { userId: string }): Promise<any> {
    console.log(`Fetching user data for userId: ${args.userId}`);
    await Promise.resolve(); // Dummy await to satisfy linter
    return { id: args.userId, name: 'John Doe', email: 'john.doe@example.com' };
  }

  private async searchProduct(args: { query: string }): Promise<any> {
    console.log(`Searching product for query: ${args.query}`);
    await Promise.resolve(); // Dummy await to satisfy linter
    return [
      { id: 'prod1', name: 'Product A', price: 100 },
      { id: 'prod2', name: 'Product B', price: 200 },
    ];
  }

  private async _resolveLocalityNameToId(
    localityName: string,
  ): Promise<string | null> {
    const localities = await this.getAvailableLocalities({});
    const foundLocality = localities.find(
      (loc: any) => loc.nombre.toLowerCase() === localityName.toLowerCase(),
    );
    return foundLocality ? foundLocality._id : null;
  }

  private async searchProperties(filters: {
    page?: number;
    pageSize?: number;
    sort?: string;
    search?: string; // JSON string for advanced search
    type?: string;
    status?: string;
    province?: string; // Province ID
    locality?: string; // Locality ID
    localityName?: string; // Locality Name
    address?: string;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    minPrice?: number; // Added minPrice
    maxPrice?: number; // Added maxPrice
    specs?: string[]; // Added specs
    // Add other relevant filters from the API spec
  }): Promise<any> {
    console.log('[searchProperties] Filters:', filters);
    const params = new URLSearchParams();
    let localityId: string | null = null; // Initialize as null

    // Prioritize localityName resolution
    if (filters.localityName) {
      localityId = await this._resolveLocalityNameToId(filters.localityName);
      if (!localityId) {
        throw new Error(`Locality '${filters.localityName}' not found.`);
      }
    } else if (filters.locality) {
      // If localityName is not provided, but locality ID is, use it directly
      localityId = filters.locality;
    }

    let advancedSearchCriteria: any[] = [];
    if (filters.search) {
      try {
        const parsedSearch = JSON.parse(filters.search);
        if (parsedSearch && parsedSearch.criteria) {
          advancedSearchCriteria = parsedSearch.criteria;
        }
      } catch (e) {
        console.warn('Invalid JSON in search parameter:', filters.search, e);
      }
    }

    // Add locality to advanced search criteria if resolved
    if (localityId) {
      advancedSearchCriteria = advancedSearchCriteria.filter(
        (criteria) => criteria.field !== 'locality',
      );
      advancedSearchCriteria.push({
        field: 'locality',
        term: localityId,
        operation: 'eq',
      });
    }

    // Add other filters to advanced search criteria
    if (filters.type) {
      advancedSearchCriteria.push({
        field: 'type',
        term: filters.type,
        operation: 'eq',
      });
    }
    if (filters.status) {
      advancedSearchCriteria.push({
        field: 'status',
        term: filters.status,
        operation: 'eq',
      });
    }
    // Eliminar cualquier criterio de province si viene en los criterios avanzados
    advancedSearchCriteria = advancedSearchCriteria.filter(
      (criteria) => criteria.field !== 'province',
    );
    if (filters.address) {
      advancedSearchCriteria.push({
        field: 'address',
        term: filters.address,
        operation: 'contains',
      });
    }
    if (filters.rooms !== undefined) {
      advancedSearchCriteria.push({
        field: 'detailedDescription.rooms',
        term: String(filters.rooms),
        operation: 'eq',
      });
    }
    if (filters.bedrooms !== undefined) {
      advancedSearchCriteria.push({
        field: 'detailedDescription.bedrooms',
        term: String(filters.bedrooms),
        operation: 'eq',
      });
    }
    if (filters.bathrooms !== undefined) {
      advancedSearchCriteria.push({
        field: 'detailedDescription.bathrooms',
        term: String(filters.bathrooms),
        operation: 'eq',
      });
    }
    if (filters.minPrice !== undefined) {
      advancedSearchCriteria.push({
        field: 'valueForSale.amount',
        term: String(filters.minPrice),
        operation: 'gte',
      });
    }
    if (filters.maxPrice !== undefined) {
      advancedSearchCriteria.push({
        field: 'valueForSale.amount',
        term: String(filters.maxPrice),
        operation: 'lte',
      });
    }
    if (filters.specs && filters.specs.length > 0) {
      filters.specs.forEach((spec) => {
        advancedSearchCriteria.push({
          field: 'specs',
          term: spec,
          operation: 'contains',
        });
      });
    }

    // Append advanced search criteria as nested query parameters
    advancedSearchCriteria.forEach((criteria, idx) => {
      params.append(`search[criteria][${idx}][field]`, criteria.field);
      params.append(`search[criteria][${idx}][term]`, criteria.term);
      params.append(`search[criteria][${idx}][operation]`, criteria.operation);
    });

    // Handle page, pageSize, sort as direct query parameters
    if (filters.page !== undefined) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize !== undefined) {
      params.append('pageSize', String(filters.pageSize));
    }
    if (filters.sort) {
      params.append('sort', filters.sort);
    }

    try {
      const url = `${this.PROPERTY_API_BASE_URL}/property/public?${params.toString()}`;
      console.log('[searchProperties] Request URL:', url);
      const response = await axios.get(url);
      console.log('[searchProperties] Response status:', response.status);
      console.log('[searchProperties] Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        '[searchProperties] Error calling property API:',
        error.message,
      );
      if (error.response) {
        console.error(
          '[searchProperties] Error response status:',
          error.response.status,
        );
        console.error(
          '[searchProperties] Error response data:',
          error.response.data,
        );
      } else if (error.request) {
        console.error(
          '[searchProperties] No response received:',
          error.request,
        );
      } else {
        console.error('[searchProperties] Error config:', error.config);
      }
      throw new Error('Failed to fetch properties from external API.');
    }
  }

  private async getAvailableLocalities(filters: {
    type?: 'all' | 'sale' | 'rent';
  }): Promise<any> {
    console.log('Getting available localities with filters:', filters);
    const params = new URLSearchParams();

    if (filters.type) {
      params.append('type', filters.type);
    }

    try {
      const url = `${this.PROPERTY_API_BASE_URL}/locality/with-available-properties?${params.toString()}`;
      console.log('[getAvailableLocalities] Request URL:', url);
      const response = await axios.get(url);
      console.log('[getAvailableLocalities] Response status:', response.status);
      console.log('[getAvailableLocalities] Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        '[getAvailableLocalities] Error calling localities API:',
        error.message,
      );
      if (error.response) {
        console.error(
          '[getAvailableLocalities] Error response status:',
          error.response.status,
        );
        console.error(
          '[getAvailableLocalities] Error response data:',
          error.response.data,
        );
      } else if (error.request) {
        console.error(
          '[getAvailableLocalities] No response received:',
          error.request,
        );
      } else {
        console.error('[getAvailableLocalities] Error config:', error.config);
      }
      throw new Error('Failed to fetch localities from external API.');
    }
  }
}
