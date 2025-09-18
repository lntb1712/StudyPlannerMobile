export class PagedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;

  constructor(data: T[] = [], currentPage: number = 1, totalPages: number = 1, totalItems: number = 0, pageSize: number = 0) {
    this.data = data;
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.totalItems = totalItems;
    this.pageSize = pageSize;
  }

 static fromJson<U>(json: Record<string, any>, itemMapper: (item: any) => U): PagedResponse<U> {
  const response = new PagedResponse<U>();

  // Hỗ trợ lớp lồng Data.Data
  const dataArray =
    json.Data?.Data ?? // Xử lý lớp lồng
    json.data?.data ??
    json.Data ??
    json.data ??
    json.items ??
    json.Items ??
    json.records ??
    json.Records ??
    [];

  console.log("Data Array:", dataArray); // Log để kiểm tra
  response.data = Array.isArray(dataArray) ? dataArray.map(itemMapper) : [];

  response.currentPage = Number(json.CurrentPage ?? json.currentPage ?? json.page ?? 1);
  response.totalPages = Number(json.TotalPages ?? json.totalPages ?? 1);
  response.totalItems = Number(json.TotalItems ?? json.totalItems ?? json.count ?? 0);
  response.pageSize = Number(json.PageSize ?? json.pageSize ?? 10);

  return response;
}

}