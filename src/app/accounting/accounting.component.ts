import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {PurchaseService} from '../core/services/purchase.service';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ExcelService} from '../core/services/excel.service';
import {PdfService} from '../core/services/pdf.service';

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss']
})
export class AccountingComponent implements OnInit {
  from_date = new Date();
  to_date = new Date();
  dataSource: MatTableDataSource<any>;
  displayedColumns: any;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('accountingTable') accountingTable: any;

  constructor(private purchaseService: PurchaseService, private excelService: ExcelService, private pdfService: PdfService) {
    this.from_date.setMonth(this.from_date.getMonth() - 1);
  }

  ngOnInit() {
    this._setTableData();
  }

  _setTableData() {
    this.purchaseService.list_from_to(this.from_date, this.to_date).valueChanges().subscribe(purchases => {
      const rows = [];
      const columns = { name: '', room: ''};
      // { columnDef: 'userId',    header: 'ID',       cell: (row: UserData) => `${row.id}`        },
      const data = {};
      purchases.map(purchase => {
        if (!(purchase.user_id in data)) {
          data[purchase.user_id] = {user_id: purchase.user_id, name: purchase.user_name, room: purchase.user_room, products: {}, total: 0};
        }
        const products = data[purchase.user_id]['products'];
        if (!(purchase.product_name in products)) {
          products[purchase.product_name] = {name: purchase.product_name, amount: purchase.amount, price: purchase.price};
        } else {
          products[purchase.product_name]['amount'] += purchase.amount;
          // products[purchase.product_id]['price'] += purchase.price;
        }

        data[purchase.user_id]['total'] += purchase.price;
      });

      Object.keys(data).forEach(user_id => {
        const value = data[user_id];
        const row = {name: value['name'], room: value['room'], total: value['total']};
        Object.keys(value['products']).forEach(key => {
          const product = value['products'][key];
          row[product.name] = product['amount'];
          columns[product['name']] = '';
        });
        rows.push(row);
      });
      columns['total'] = '';
      this.displayedColumns = Object.keys(columns);
      this.dataSource = new MatTableDataSource(rows);
      this.dataSource.sort = this.sort;
    });
  }

  exportAsXLSX(): void {
    const name = this.from_date.toLocaleDateString() + '_' + this.to_date.toLocaleDateString();
    this.excelService.exportAsExcelFile(this.dataSource.data, name);
  }

  exportAsPdf(): void {
    const table = document.getElementById('accountingTable');
    console.log(table);
    console.log(table.innerHTML);
    console.log(this.accountingTable._element);
    this.pdfService.exportAsPdfFile(table.innerHTML, this.dataSource.data, 'tats');
  }

  fromDateFilter = (date: Date): boolean => {
    return !this.to_date || date <= this.to_date;
  };

  toDateFilter = (date: Date): boolean => {
    return !this.from_date || date >= this.from_date;
  };

  fromDateChange() {
    this._setTableData();
  }

  toDateChange() {
    this._setTableData();
  }

}