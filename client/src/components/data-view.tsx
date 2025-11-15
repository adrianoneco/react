import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DataViewColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataViewProps<T> {
  data: T[];
  columns: DataViewColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataView<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  searchPlaceholder = "Buscar...",
  onSearch,
  filters,
  actions,
}: DataViewProps<T>) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("cards")}
                className="rounded-r-none"
                data-testid="button-view-cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className="rounded-l-none"
                data-testid="button-view-table"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {filters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {viewMode === "cards" ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.length > 0 ? (
              data.map((item) => (
                <div key={keyExtractor(item)} data-testid={`card-${keyExtractor(item)}`}>
                  {renderCard(item)}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={String(column.key)}>{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={keyExtractor(item)} data-testid={`row-${keyExtractor(item)}`}>
                        {columns.map((column) => (
                          <TableCell key={String(column.key)}>
                            {column.render
                              ? column.render(item)
                              : String((item as any)[column.key] || "-")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                        Nenhum resultado encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
