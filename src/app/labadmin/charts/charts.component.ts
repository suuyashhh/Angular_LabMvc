// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-charts',
//   standalone: true,
//   imports: [],
//   templateUrl: './charts.component.html',
//   styleUrl: './charts.component.css'
// })
// export class ChartsComponent {

// }
import { Component, type OnInit, type OnDestroy, type ElementRef, ViewChild, type AfterViewInit } from "@angular/core"

interface ChartData {
  date: string
  sales: number
  orders: number
  customers: number
}

@Component({
   selector: 'app-charts',
  standalone: true,
  imports: [],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("barsContainer", { static: false }) barsContainer!: ElementRef
  @ViewChild("tooltip", { static: false }) tooltip!: ElementRef
  @ViewChild("overlay", { static: false }) overlay!: ElementRef
  @ViewChild("tooltipClose", { static: false }) tooltipClose!: ElementRef

  // Sample data for 31 days
  chartData: ChartData[] = [
    { date: "1", sales: 45, orders: 12, customers: 8 },
    { date: "2", sales: 52, orders: 15, customers: 11 },
    { date: "3", sales: 38, orders: 9, customers: 7 },
    { date: "4", sales: 67, orders: 18, customers: 14 },
    { date: "5", sales: 43, orders: 11, customers: 9 },
    { date: "6", sales: 78, orders: 22, customers: 16 },
    { date: "7", sales: 56, orders: 16, customers: 12 },
    { date: "8", sales: 34, orders: 8, customers: 6 },
    { date: "9", sales: 89, orders: 25, customers: 19 },
    { date: "10", sales: 72, orders: 20, customers: 15 },
    { date: "11", sales: 41, orders: 10, customers: 8 },
    { date: "12", sales: 63, orders: 17, customers: 13 },
    { date: "13", sales: 55, orders: 14, customers: 11 },
    { date: "14", sales: 47, orders: 13, customers: 10 },
    { date: "15", sales: 82, orders: 23, customers: 17 },
    { date: "16", sales: 39, orders: 9, customers: 7 },
    { date: "17", sales: 71, orders: 19, customers: 15 },
    { date: "18", sales: 58, orders: 16, customers: 12 },
    { date: "19", sales: 46, orders: 12, customers: 9 },
    { date: "20", sales: 65, orders: 18, customers: 14 },
    { date: "21", sales: 53, orders: 15, customers: 11 },
    { date: "22", sales: 77, orders: 21, customers: 16 },
    { date: "23", sales: 42, orders: 11, customers: 8 },
    { date: "24", sales: 69, orders: 19, customers: 14 },
    { date: "25", sales: 51, orders: 14, customers: 10 },
    { date: "26", sales: 84, orders: 24, customers: 18 },
    { date: "27", sales: 37, orders: 8, customers: 6 },
    { date: "28", sales: 62, orders: 17, customers: 13 },
    { date: "29", sales: 48, orders: 13, customers: 10 },
    { date: "30", sales: 75, orders: 21, customers: 16 },
    { date: "31", sales: 59, orders: 16, customers: 12 },
  ]

  private activeBar: HTMLElement | null = null
  private maxValue = 0
  private isMobile = false
  private resizeListener?: () => void

  ngOnInit(): void {
    this.maxValue = Math.max(...this.chartData.map((d) => d.sales))
    this.isMobile = window.innerWidth <= 768
    this.setupResizeListener()
  }

  ngAfterViewInit(): void {
    this.initChart()
    this.addLoadAnimation()
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener)
    }
    document.removeEventListener("keydown", this.handleKeydown)
  }

  // Initialize chart
  private initChart(): void {
    this.createBars()
    this.setupEventListeners()
  }

  // Create bars with dates directly below them
  private createBars(): void {
    if (!this.barsContainer) return

    const container = this.barsContainer.nativeElement
    container.innerHTML = ""

    this.chartData.forEach((data, index) => {
      // Create wrapper for bar and date
      const barWrapper = document.createElement("div")
      barWrapper.className = "bar-wrapper"

      // Create bar
      const bar = document.createElement("div")
      bar.className = "bar"
      bar.dataset["index"] = index.toString()

      // Calculate height percentage
      const heightPercent = (data.sales / this.maxValue) * 100
      bar.style.height = `${heightPercent}%`

      // Create date label
      const dateLabel = document.createElement("div")
      dateLabel.className = "bar-date"
      dateLabel.textContent = data.date

      // Append bar and date to wrapper
      barWrapper.appendChild(bar)
      barWrapper.appendChild(dateLabel)

      // Append wrapper to container
      container.appendChild(barWrapper)
    })
  }

  // Setup event listeners
  private setupEventListeners(): void {
    const bars = document.querySelectorAll(".bar")

    bars.forEach((bar) => {
      if (this.isMobile) {
        // Mobile: click events
        bar.addEventListener("click", (e) => this.handleBarClick(e as MouseEvent))
      } else {
        // Desktop: hover events
        bar.addEventListener("mouseenter", (e) => this.handleBarHover(e as MouseEvent))
        bar.addEventListener("mouseleave", (e) => this.handleBarLeave(e as MouseEvent))
      }
    })

    // Close tooltip events
    if (this.tooltipClose) {
      this.tooltipClose.nativeElement.addEventListener("click", () => this.hideTooltip())
    }
    if (this.overlay) {
      this.overlay.nativeElement.addEventListener("click", () => this.hideTooltip())
    }

    // Keyboard accessibility
    document.addEventListener("keydown", this.handleKeydown.bind(this))
  }

  // Handle keydown events
  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.hideTooltip()
    }
  }

  // Handle bar click (mobile)
  private handleBarClick(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const index = Number.parseInt(target.dataset["index"] || "0")
    const data = this.chartData[index]

    // Remove active class from all bars
    document.querySelectorAll(".bar").forEach((b) => b.classList.remove("active"))

    // Add active class to clicked bar
    target.classList.add("active")
    this.activeBar = target

    this.showTooltip(data, target)
  }

  // Handle bar hover (desktop)
  private handleBarHover(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const index = Number.parseInt(target.dataset["index"] || "0")
    const data = this.chartData[index]

    target.classList.add("active")
    this.activeBar = target

    this.showTooltip(data, target)
  }

  // Handle bar leave (desktop)
  private handleBarLeave(e: MouseEvent): void {
    const target = e.target as HTMLElement
    target.classList.remove("active")
    this.activeBar = null

    this.hideTooltip()
  }

  // Show tooltip
  private showTooltip(data: ChartData, barElement: HTMLElement): void {
    if (!this.tooltip) return

    const tooltip = this.tooltip.nativeElement

    // Update tooltip content
    const dateElement = tooltip.querySelector(".tooltip-date")
    const salesElement = tooltip.querySelector(".sales-value")
    const ordersElement = tooltip.querySelector(".orders-value")
    const customersElement = tooltip.querySelector(".customers-value")

    if (dateElement) dateElement.textContent = `January ${data.date}, 2024`
    if (salesElement) salesElement.textContent = `₹${data.sales}k`
    if (ordersElement) ordersElement.textContent = data.orders.toString()
    if (customersElement) customersElement.textContent = data.customers.toString()

    // Get bar position relative to the chart container
    const barRect = barElement.getBoundingClientRect()
    const chartContainer = document.querySelector(".chart-wrapper")
    const containerRect = chartContainer?.getBoundingClientRect()

    if (!containerRect) return

    // Calculate position relative to the chart container
    let left = barRect.left - containerRect.left + barRect.width / 2
    let top = barRect.top - containerRect.top - 10

    // Show tooltip first to get its dimensions
    tooltip.classList.add("show")
    const tooltipRect = tooltip.getBoundingClientRect()

    if (this.isMobile) {
      // Mobile: position tooltip near the clicked bar
      // Adjust horizontal position to keep tooltip in view
      const chartWrapperWidth = chartContainer?.clientWidth || 0

      // Center tooltip on bar, but keep it within chart bounds
      left = left - tooltipRect.width / 2

      // Keep tooltip within chart container bounds
      if (left < 10) {
        left = 10
      } else if (left + tooltipRect.width > chartWrapperWidth - 10) {
        left = chartWrapperWidth - tooltipRect.width - 10
      }

      // Position above the bar, or below if not enough space
      if (top - tooltipRect.height < 10) {
        top = barRect.bottom - containerRect.top + 10
      } else {
        top = top - tooltipRect.height
      }

      // Position relative to chart container
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
      tooltip.style.position = "absolute"
    } else {
      // Desktop: position near bar with viewport calculations
      left = barRect.left + barRect.width / 2 - tooltipRect.width / 2
      top = barRect.top - tooltipRect.height - 10

      // Adjust if tooltip goes off screen
      if (left < 10) left = 10
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10
      }
      if (top < 10) {
        top = barRect.bottom + 10
      }

      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
      tooltip.style.position = "fixed"
    }
  }

  // Hide tooltip
  hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.nativeElement.classList.remove("show")
    }
    if (this.overlay) {
      this.overlay.nativeElement.classList.remove("show")
    }

    if (this.activeBar) {
      this.activeBar.classList.remove("active")
      this.activeBar = null
    }
  }

  // Setup resize listener
  private setupResizeListener(): void {
    this.resizeListener = () => {
      const newIsMobile = window.innerWidth <= 768

      if (newIsMobile !== this.isMobile) {
        this.isMobile = newIsMobile
        this.initChart() // Reinitialize with correct event listeners
      }

      this.hideTooltip()
    }

    window.addEventListener("resize", this.resizeListener)
  }

  // Add loading animation
  private addLoadAnimation(): void {
    setTimeout(() => {
      const bars = document.querySelectorAll(".bar")
      bars.forEach((bar, index) => {
        setTimeout(() => {
          ;(bar as HTMLElement).style.transform = "scaleY(1)"
          ;(bar as HTMLElement).style.transformOrigin = "bottom"
        }, index * 50)
      })
    }, 100)
  }
}
