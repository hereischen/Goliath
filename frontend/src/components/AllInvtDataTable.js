import React from 'react';
import InventoryTable from "./common/InventoryTable";
import WithdrawDialog from './dialog/WithdrawDialog';
import { Alert} from 'react-bootstrap';

export default class AllInvtDataTable extends React.Component{
    constructor (props) {
        super(props);
        this.state = {
            next: null,
            previous: null,
            originalData: [],
            allInventories: [],
            url : "/inventory/inventories",
            depositTableData: [],
            showWithdrawDialog: false,
            selectedMerchandiseId: 0,
            showWithdrawResultAlert: false,
            pageSize: 20,
            page: 0,
        };
        this.CURRENT_KEY = 'all';
        this.getAllInventories();
        this.onRowClick = this.onRowClick.bind(this);
        this.onCloseDialog = this.onCloseDialog.bind(this);
        this.onConfirmWithDraw = this.onConfirmWithDraw.bind(this);
        this.onFetchData = this.onFetchData.bind(this);
    }

    static buildAllInventoryTable(inventories) {
        return _.chain(inventories)
            .orderBy(invt => invt.merchandise.id)
            .map(invt => {
                return {
                    brand: invt.merchandise.brand.brand,
                    category: invt.merchandise.category.category,
                    id: invt.merchandise.id,
                    code: invt.merchandise.code,
                    remarks: invt.merchandise.remarks,
                    quantity: invt.quantity,
                    certification: invt.merchandise.certification,
                    spare_parts: invt.merchandise.spare_parts,
                    model: invt.merchandise.model,
                }})
            .value();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.currentKey !== this.CURRENT_KEY && this.props.currentKey === this.CURRENT_KEY) {
            this.getAllInventories();
        }
        return this.state;
    }

    getAllInventories() {
        const url = `${this.state.url}?page_size=${this.state.pageSize}&page=${this.state.page+1}`;
        $.get(url, (data) => {
            const inventories = AllInvtDataTable.buildAllInventoryTable(data.results);
            this.setState({
                allInventories: inventories,
                originalData: inventories,
                showWithdrawDialog: false,
                pages: Math.ceil(data.count / this.state.pageSize),
            });
        });
    }


    onRowClick(merchandise) {
        $.get(`inventory/inventories/merchandise?id=${merchandise.id}`, (data) => {
            const depositTableData = this.buildDepositData(data.results);
            this.setState({
                depositTableData: depositTableData,
                showWithdrawDialog: true,
                selectedMerchandiseId: merchandise.id,
            });
        });
    }

    buildDepositData(data) {
        return _(data)
            .filter(invt => invt.merchant.id !== this.props.currentUser)
            .map((invt => {
                return {
                    merchantName: invt.merchant.name,
                    merchantId: invt.merchant.id,
                    mobile: invt.merchant.mobile,
                    email: invt.merchant.email,
                    dingding: invt.merchant.dingding,
                    address: invt.merchant.address,
                    quantity: invt.quantity,
                    price: invt.price,
                    id: invt.id,
                    info: invt.info,
                }
            }))
            .value();
    }

    getColumns() {
        return [{
            title: "编号",
            selector: "id",
            type: "text",
        },{
            title: "品牌",
            selector: "brand",
            type: "text",
        }, {
            title: "品类",
            selector: "category",
            type: "text",
        }, {
            title: "商品编码",
            selector: "code",
            type: "text",
        }, {
            title: "数量",
            selector: "quantity",
            type: "text"
        }, {
            title: "型号",
            selector: "model",
            type: "text"
        }, {
            title: "认证",
            selector: "certification",
            type: "text"
        }, {
            title: "属性",
            selector: "spare_parts",
            type: "action",
            renderContent: row => {
                return <span title={row.value}>{row.value}</span>
            }
        }, {
            title: "操作",
            type: "action",
            renderContent: (row) =>
            {
                return (
                    <button onClick={() => {this.onRowClick(row.original)}}>...</button>
                )
            }
        }
        ]
    }

    onConfirmWithDraw(result) {
        this.setState({
            showWithdrawResultAlert: true,
            ...result
        },
            () => {
            window.setTimeout(()=>{
                this.setState({showWithdrawResultAlert:false})
            },4000)
        }
        );

        this.getAllInventories();
    }

    onCloseDialog() {
        this.setState({showWithdrawDialog: false});
    }


    onFetchData(state) {
        if (this.state.page !== state.page || this.state.pageSize !== state.pageSize) {
            this.setState({
                page: state.page,
                pageSize: state.pageSize
            },  this.getAllInventories);
        }

        const allInventories =  this.applySortAndFilter(state.filtered, state.sorted);
        this.setState({allInventories})
    }

    applySortAndFilter(filtered, sorted) {
        let filteredData = this.state.originalData;
        if (!_.isEmpty(filtered)) {
            filteredData = filtered.reduce((filteredSoFar, nextFilter) => {
                return filteredSoFar.filter(row => {
                    return (row[nextFilter.id] + "").includes(nextFilter.value);
                });
            }, filteredData);
        }
        return _.orderBy(
            filteredData,
            sorted.map(
                sort => {
                    return row => {
                        if (row[sort.id] === null || row[sort.id] === undefined) {
                            return -Infinity;
                        }
                        return typeof row[sort.id] === "string"
                            ? row[sort.id].toLowerCase()
                            : row[sort.id];
                    };
                }),
            sorted.map(d => (d.desc ? "desc" : "asc"))
        );
    }

    render() {
        return (<div id="all">
            <InventoryTable className="inventory-table"
                            data={this.state.allInventories}
                            columns={this.getColumns()}
                            showPagination={true}
                            onFetchData={this.onFetchData}
                            pages={this.state.pages}
                            pageSize={this.state.pageSize}
                            manual={true}
            />
            <WithdrawDialog depositTableData= {this.state.depositTableData}
                            show={this.state.showWithdrawDialog}
                            onClose={this.onCloseDialog}
                            onConfirm={this.onConfirmWithDraw}
                            currentUser={this.props.currentUser}
                            selectedMerchandiseId={this.state.selectedMerchandiseId}

            />
            {this.state.showWithdrawResultAlert && <Alert bsStyle={this.state.messageType}>{this.state.message}</Alert>}
        </div>);
    }
}
