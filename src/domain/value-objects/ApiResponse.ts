import { PagedResponse } from "./PagedResponse";

/**
 * A generic class to represent an API response with success status, message, and data.
 */
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;

  /**
   * Constructs an ApiResponse instance.
   */
  constructor({ success, message, data }: { success: boolean; message: string; data: T | null }) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  /**
   * Creates an ApiResponse from a JSON object.
   */
  static fromJson<T>(
    json: Record<string, any>,
    itemMapper?: (item: any) => any
  ): ApiResponse<T> {
    let data: T | null = null;
    const rawData = json.data ?? json.Data;

    if (rawData !== undefined && rawData !== null) {
      // Nếu có cấu trúc phân trang (PagedResponse)
      if (
        typeof rawData === "object" &&
        ("items" in rawData || "Items" in rawData ||
         "totalItems" in rawData || "TotalItems" in rawData)
      ) {
        data = PagedResponse.fromJson(rawData, itemMapper ?? ((x: any) => x)) as T;
      }
      // Nếu là mảng []
      else if (Array.isArray(rawData)) {
        data = (itemMapper ? rawData.map(itemMapper) : rawData) as unknown as T;
      }
      // Nếu là object đơn
      else {
        data = (itemMapper ? itemMapper(rawData) : rawData) as T;
      }
    }

    return new ApiResponse<T>({
      success: json.success ?? json.Success ?? false,
      message: json.message ?? json.Message ?? "No message provided",
      data,
    });
  }

  /**
   * Checks if the API response indicates success.
   */
  isSuccess(): boolean {
    return this.success === true;
  }

  /**
   * Factory method to create a successful ApiResponse.
   */
  static success<T>(data: T, message = "Thành công"): ApiResponse<T> {
    return new ApiResponse<T>({ success: true, message, data });
  }

  /**
   * Factory method to create a failed ApiResponse.
   */
  static error<T>(message = "Thất bại", data: T | null = null): ApiResponse<T> {
    return new ApiResponse<T>({ success: false, message, data });
  }
}
