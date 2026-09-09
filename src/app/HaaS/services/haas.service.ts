import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DataCenterMetrics,
  EcosystemDemand,
  HeatAllocation,
  OptimizationLog,
  OptimizationRequest,
  ThermalStorageStatus
} from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class HaaSService {

  // Same base URL used by the rest of the Angular app
  private base = 'https://backend.suyashpatil.in/api/haas';
  // Development override: 'https://localhost:7193/api/haas'

  constructor(private http: HttpClient) {}

  // ── Data Center ─────────────────────────────────────────────────────────────

  getLatestMetrics(): Observable<DataCenterMetrics> {
    return this.http.get<DataCenterMetrics>(`${this.base}/datacenter/latest`);
  }

  getMetricsHistory(from?: string, to?: string): Observable<DataCenterMetrics[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<DataCenterMetrics[]>(`${this.base}/datacenter/history`, { params });
  }

  simulateMetrics(outsideTemp: number = 15, season: number = 1): Observable<DataCenterMetrics> {
    return this.http.post<DataCenterMetrics>(
      `${this.base}/datacenter/simulate?outsideTemp=${outsideTemp}&season=${season}`, {}
    );
  }

  // ── Ecosystem Demands ────────────────────────────────────────────────────────

  getAllDemands(): Observable<EcosystemDemand[]> {
    return this.http.get<EcosystemDemand[]>(`${this.base}/ecosystem/demands`);
  }

  getDemandsBySeason(seasonType: number): Observable<EcosystemDemand[]> {
    return this.http.get<EcosystemDemand[]>(
      `${this.base}/ecosystem/demands/by-season?seasonType=${seasonType}`
    );
  }

  upsertDemand(demand: EcosystemDemand): Observable<any> {
    return this.http.put<any>(`${this.base}/ecosystem/demands`, demand);
  }

  seedDefaultDemands(): Observable<any> {
    return this.http.post<any>(`${this.base}/ecosystem/seed`, {});
  }

  // ── Thermal Storage ──────────────────────────────────────────────────────────

  getStorageStatus(): Observable<ThermalStorageStatus> {
    return this.http.get<ThermalStorageStatus>(`${this.base}/storage/status`);
  }

  getStorageHistory(limit: number = 50): Observable<ThermalStorageStatus[]> {
    return this.http.get<ThermalStorageStatus[]>(
      `${this.base}/storage/history?limit=${limit}`
    );
  }

  // ── Optimization ─────────────────────────────────────────────────────────────

  runOptimization(request: OptimizationRequest): Observable<HeatAllocation> {
    return this.http.post<HeatAllocation>(`${this.base}/optimize/run`, request);
  }

  getOptimizationLogs(from?: string, to?: string, limit: number = 100): Observable<OptimizationLog[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<OptimizationLog[]>(`${this.base}/optimize/logs`, { params });
  }
}
