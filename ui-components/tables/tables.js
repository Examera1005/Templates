/**
 * Universal Table Component
 * Pure JavaScript table system with sorting, filtering, pagination, and responsive design
 * Zero dependencies, fully accessible, and customizable
 */

class DataTable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      data: [],
      columns: [],
      sortable: true,
      filterable: true,
      searchable: true,
      selectable: false,
      pagination: true,
      pageSize: 10,
      responsive: true,
      loading: false,
      emptyMessage: 'No data available',
      ...options
    };

    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.searchTerm = '';
    this.filters = {};
    this.selectedRows = new Set();
    this.filteredData = [];

    this.init();
  }

  init() {
    this.processData();
    this.render();
    this.bindEvents();
  }

  processData() {
    let data = [...this.options.data];

    // Apply search filter
    if (this.searchTerm) {
      data = data.filter(row => {
        return this.options.columns.some(col => {
          const value = this.getCellValue(row, col.key);
          return String(value).toLowerCase().includes(this.searchTerm.toLowerCase());
        });
      });
    }

    // Apply column filters
    Object.entries(this.filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        data = data.filter(row => {
          const value = this.getCellValue(row, column);
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        });
      }
    });

    // Apply sorting
    if (this.sortColumn) {
      data.sort((a, b) => {
        const aVal = this.getCellValue(a, this.sortColumn);
        const bVal = this.getCellValue(b, this.sortColumn);
        
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;
        
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    this.filteredData = data;
    this.totalPages = Math.ceil(data.length / this.options.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getCellValue(row, key) {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row) ?? '';
  }

  render() {
    const container = this.element;
    container.className = 'table-container';
    container.innerHTML = this.generateHTML();
    
    this.setupResponsive();
    
    if (this.options.loading) {
      this.showLoading();
    }
  }

  generateHTML() {
    return `
      ${this.generateHeader()}
      ${this.generateSelectionBar()}
      ${this.generateTable()}
      ${this.generateCards()}
      ${this.generateFooter()}
    `;
  }

  generateHeader() {
    if (!this.options.title && !this.options.searchable && !this.options.actions) {
      return '';
    }

    return `
      <div class="table-header">
        <div>
          ${this.options.title ? `<h3 class="table-title">${this.options.title}</h3>` : ''}
          ${this.options.subtitle ? `<p class="table-subtitle">${this.options.subtitle}</p>` : ''}
        </div>
        <div class="table-actions">
          ${this.options.searchable ? this.generateSearch() : ''}
          ${this.options.filterable ? this.generateFilters() : ''}
          ${this.options.actions ? this.options.actions : ''}
        </div>
      </div>
    `;
  }

  generateSearch() {
    return `
      <div class="table-search">
        <span class="table-search-icon">🔍</span>
        <input type="text" placeholder="Search..." value="${this.searchTerm}" class="table-search-input">
      </div>
    `;
  }

  generateFilters() {
    const filterableColumns = this.options.columns.filter(col => col.filterable);
    if (filterableColumns.length === 0) return '';

    return filterableColumns.map(col => `
      <div class="table-filter">
        <select class="table-filter-select" data-column="${col.key}">
          <option value="">All ${col.title}</option>
          ${this.getFilterOptions(col.key).map(option => 
            `<option value="${option}" ${this.filters[col.key] === option ? 'selected' : ''}>${option}</option>`
          ).join('')}
        </select>
      </div>
    `).join('');
  }

  getFilterOptions(columnKey) {
    const values = this.options.data.map(row => this.getCellValue(row, columnKey));
    return [...new Set(values)].filter(val => val !== '').sort();
  }

  generateSelectionBar() {
    if (!this.options.selectable) return '';
    
    return `
      <div class="table-selection-bar" ${this.selectedRows.size === 0 ? '' : 'class="show"'}>
        <div class="table-selection-info">
          ${this.selectedRows.size} item(s) selected
        </div>
        <div class="table-selection-actions">
          <button class="table-btn outline table-btn-clear-selection">Clear</button>
          <button class="table-btn secondary table-btn-bulk-action">Actions</button>
        </div>
      </div>
    `;
  }

  generateTable() {
    const startIndex = (this.currentPage - 1) * this.options.pageSize;
    const endIndex = startIndex + this.options.pageSize;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              ${this.options.selectable ? '<th class="checkbox-col"><input type="checkbox" class="table-checkbox table-select-all"></th>' : ''}
              ${this.options.columns.map(col => this.generateHeaderCell(col)).join('')}
            </tr>
          </thead>
          <tbody>
            ${pageData.length === 0 ? this.generateEmptyRow() : pageData.map((row, index) => this.generateDataRow(row, startIndex + index)).join('')}
          </tbody>
        </table>
        ${this.options.loading ? '<div class="table-loading"><div class="table-spinner"></div></div>' : ''}
      </div>
    `;
  }

  generateHeaderCell(column) {
    const sortable = this.options.sortable && column.sortable !== false;
    const sortClass = this.sortColumn === column.key ? `sort-${this.sortDirection}` : '';
    
    return `
      <th class="${sortable ? 'sortable' : ''} ${sortClass} ${column.className || ''}" 
          ${sortable ? `data-sort="${column.key}"` : ''}>
        ${column.title}
      </th>
    `;
  }

  generateDataRow(row, index) {
    const isSelected = this.selectedRows.has(index);
    
    return `
      <tr class="${isSelected ? 'selected' : ''}" data-row-index="${index}">
        ${this.options.selectable ? `<td class="checkbox-col"><input type="checkbox" class="table-checkbox table-row-select" ${isSelected ? 'checked' : ''}></td>` : ''}
        ${this.options.columns.map(col => this.generateDataCell(row, col)).join('')}
      </tr>
    `;
  }

  generateDataCell(row, column) {
    const value = this.getCellValue(row, column.key);
    let cellContent = value;

    // Apply column renderer if provided
    if (column.render) {
      cellContent = column.render(value, row);
    } else {
      // Built-in renderers
      switch (column.type) {
        case 'status':
          cellContent = `<span class="status-badge ${this.getStatusClass(value)}">${value}</span>`;
          break;
        case 'user':
          cellContent = `
            <div class="table-user">
              <img src="${row.avatar || 'https://via.placeholder.com/32'}" alt="${value}" class="table-avatar">
              <div class="table-user-info">
                <div class="table-user-name">${value}</div>
                <div class="table-user-email">${row.email || ''}</div>
              </div>
            </div>
          `;
          break;
        case 'currency':
          cellContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
          break;
        case 'date':
          cellContent = new Date(value).toLocaleDateString();
          break;
        case 'actions':
          cellContent = column.actions ? column.actions.map(action => 
            `<button class="table-btn ${action.className || 'outline'} table-btn-sm" data-action="${action.key}">${action.label}</button>`
          ).join('') : '';
          break;
      }
    }

    return `<td class="${column.type || ''} ${column.className || ''}">${cellContent}</td>`;
  }

  getStatusClass(status) {
    const statusMap = {
      'active': 'success',
      'inactive': 'neutral',
      'pending': 'warning',
      'error': 'error',
      'success': 'success',
      'warning': 'warning',
      'info': 'info'
    };
    return statusMap[status.toLowerCase()] || 'neutral';
  }

  generateEmptyRow() {
    const colSpan = this.options.columns.length + (this.options.selectable ? 1 : 0);
    return `
      <tr>
        <td colspan="${colSpan}">
          <div class="table-empty">
            <div class="table-empty-icon">📋</div>
            <div class="table-empty-title">No data found</div>
            <div class="table-empty-text">${this.options.emptyMessage}</div>
          </div>
        </td>
      </tr>
    `;
  }

  generateCards() {
    if (!this.options.responsive) return '';

    const startIndex = (this.currentPage - 1) * this.options.pageSize;
    const endIndex = startIndex + this.options.pageSize;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return `
      <div class="table-cards">
        ${pageData.map((row, index) => this.generateCard(row, startIndex + index)).join('')}
      </div>
    `;
  }

  generateCard(row, index) {
    const isSelected = this.selectedRows.has(index);
    const actionsColumn = this.options.columns.find(col => col.type === 'actions');
    
    return `
      <div class="table-card ${isSelected ? 'selected' : ''}" data-row-index="${index}">
        <div class="table-card-header">
          <div class="table-card-title">${this.getCellValue(row, this.options.columns[0].key)}</div>
          <div class="table-card-actions">
            ${this.options.selectable ? `<input type="checkbox" class="table-checkbox table-row-select" ${isSelected ? 'checked' : ''}>` : ''}
            ${actionsColumn ? actionsColumn.actions.map(action => 
              `<button class="table-btn ${action.className || 'outline'} table-btn-sm" data-action="${action.key}">${action.label}</button>`
            ).join('') : ''}
          </div>
        </div>
        <div class="table-card-body">
          ${this.options.columns.slice(1).filter(col => col.type !== 'actions').map(col => `
            <div class="table-card-field">
              <div class="table-card-label">${col.title}</div>
              <div class="table-card-value">${this.getCellValue(row, col.key)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateFooter() {
    if (!this.options.pagination && !this.options.showInfo) return '';

    const startIndex = (this.currentPage - 1) * this.options.pageSize + 1;
    const endIndex = Math.min(this.currentPage * this.options.pageSize, this.filteredData.length);

    return `
      <div class="table-footer">
        ${this.options.showInfo ? `<div class="table-info">Showing ${startIndex}-${endIndex} of ${this.filteredData.length} entries</div>` : ''}
        ${this.options.pagination ? this.generatePagination() : ''}
      </div>
    `;
  }

  generatePagination() {
    return `
      <div class="table-pagination">
        <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="prev">Previous</button>
        <span class="current-page">${this.currentPage} of ${this.totalPages}</span>
        <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="next">Next</button>
      </div>
    `;
  }

  setupResponsive() {
    if (!this.options.responsive) return;

    const checkWidth = () => {
      const tableWrapper = this.element.querySelector('.table-wrapper');
      const tableCards = this.element.querySelector('.table-cards');
      
      if (window.innerWidth <= 768) {
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (tableCards) tableCards.style.display = 'block';
      } else {
        if (tableWrapper) tableWrapper.style.display = 'block';
        if (tableCards) tableCards.style.display = 'none';
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
  }

  bindEvents() {
    const container = this.element;

    // Search
    const searchInput = container.querySelector('.table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.currentPage = 1;
        this.update();
      });
    }

    // Filters
    container.addEventListener('change', (e) => {
      if (e.target.matches('.table-filter-select')) {
        const column = e.target.dataset.column;
        this.filters[column] = e.target.value;
        this.currentPage = 1;
        this.update();
      }
    });

    // Sorting
    container.addEventListener('click', (e) => {
      if (e.target.matches('th[data-sort]')) {
        const column = e.target.dataset.sort;
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        }
        this.update();
      }
    });

    // Pagination
    container.addEventListener('click', (e) => {
      if (e.target.matches('[data-page]')) {
        const page = e.target.dataset.page;
        if (page === 'prev' && this.currentPage > 1) {
          this.currentPage--;
        } else if (page === 'next' && this.currentPage < this.totalPages) {
          this.currentPage++;
        }
        this.update();
      }
    });

    // Row selection
    if (this.options.selectable) {
      // Select all
      container.addEventListener('change', (e) => {
        if (e.target.matches('.table-select-all')) {
          const isChecked = e.target.checked;
          const startIndex = (this.currentPage - 1) * this.options.pageSize;
          const endIndex = startIndex + this.options.pageSize;
          
          for (let i = startIndex; i < endIndex && i < this.filteredData.length; i++) {
            if (isChecked) {
              this.selectedRows.add(i);
            } else {
              this.selectedRows.delete(i);
            }
          }
          this.update();
        }
      });

      // Select individual rows
      container.addEventListener('change', (e) => {
        if (e.target.matches('.table-row-select')) {
          const rowIndex = parseInt(e.target.closest('[data-row-index]').dataset.rowIndex);
          if (e.target.checked) {
            this.selectedRows.add(rowIndex);
          } else {
            this.selectedRows.delete(rowIndex);
          }
          this.updateSelectionBar();
        }
      });

      // Clear selection
      container.addEventListener('click', (e) => {
        if (e.target.matches('.table-btn-clear-selection')) {
          this.selectedRows.clear();
          this.update();
        }
      });
    }

    // Action buttons
    container.addEventListener('click', (e) => {
      if (e.target.matches('[data-action]')) {
        const action = e.target.dataset.action;
        const rowElement = e.target.closest('[data-row-index]');
        const rowIndex = rowElement ? parseInt(rowElement.dataset.rowIndex) : null;
        const rowData = rowIndex !== null ? this.filteredData[rowIndex % this.options.pageSize + (this.currentPage - 1) * this.options.pageSize] : null;
        
        this.trigger('action', { action, rowIndex, rowData, selectedRows: Array.from(this.selectedRows) });
      }
    });
  }

  update() {
    this.processData();
    this.render();
    this.bindEvents();
    this.trigger('update');
  }

  updateSelectionBar() {
    const selectionBar = this.element.querySelector('.table-selection-bar');
    const selectionInfo = this.element.querySelector('.table-selection-info');
    
    if (selectionBar && selectionInfo) {
      selectionInfo.textContent = `${this.selectedRows.size} item(s) selected`;
      selectionBar.classList.toggle('show', this.selectedRows.size > 0);
    }
  }

  showLoading() {
    const loading = this.element.querySelector('.table-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = this.element.querySelector('.table-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  setData(data) {
    this.options.data = data;
    this.selectedRows.clear();
    this.currentPage = 1;
    this.update();
  }

  getSelectedData() {
    return Array.from(this.selectedRows).map(index => this.filteredData[index]);
  }

  trigger(eventName, detail = {}) {
    const event = new CustomEvent(`table:${eventName}`, {
      detail: { table: this, ...detail }
    });
    this.element.dispatchEvent(event);
  }
}

// Auto-initialize tables with data attributes
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-table]').forEach(element => {
    const options = JSON.parse(element.dataset.table || '{}');
    new DataTable(element, options);
  });
});

// Export class
window.DataTable = DataTable;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataTable;
}