import React from 'react';
import InventoryTable from "./common/InventoryTable";
import {Alert} from 'react-bootstrap';
import utils from "../utils/utils";
import PersonalInventoryCreateDialog from './PersonalInventoryCreateDialog';
import PersonalInventoryUpdateDialog from './PersonalInventoryUpdateDialog';

export default class PersonalDataTable extends React.Component{
    constructor (props) {
        super(props);
        this.state = {
            next: null,
            previous: null,
            personalInventories: [],
            showCreateInvtDialog: false,
            showUpdateInvtDialog: false,
            showUpdateInvtResult: false,
            message: "",
            messageType: "",
            url: `/inventory/inventories/merchants?id=${this.props.currentUser}`,
            pageSize: 10,
            page: 0,
        };
        this.getPersonalInventories(this.state.url);
        this.showCreateDialog = this.showCreateDialog.bind(this);
        this.onRowClick = this.onRowClick.bind(this);
        this.onSaveInventry = this.onSaveInventry.bind(this);
        this.onInventoryCreate = this.onInventoryCreate.bind(this);
        this.onFetchData = this.onFetchData.bind(this);
    }


    getPersonalInventories() {
        const url = `${this.state.url}&page_size=${this.state.pageSize}&page=${this.state.page+1}`;
        $.get(url, (data) => {
            const inventories = PersonalDataTable.buildPersonalInventoryTable(data.results);
            this.setState({
                next: data.next,
                previous: data.previous,
                personalInventories: inventories,
                options: [],
            });
        });
    }

    static buildPersonalInventoryTable(inventories) {
        return _.chain(inventories)
            .orderBy(invt => invt.merchandise.id)
            .map(invt => {
            return {
                brand: invt.merchandise.brand.brand,
                category: invt.merchandise.category.category,
                id: invt.merchandise.id,
                info: invt.info,
                code: invt.merchandise.code,
                remarks: invt.merchandise.remarks,
                quantity: invt.quantity,
                price: invt.price,
                certification: invt.merchandise.certification,
                spare_parts: invt.merchandise.spare_parts,
                model: invt.merchandise.model,
                after_sales: invt.merchandise.after_sales,
                modifiedDate: utils.formatDate(invt.modified_date, "YYYY-MM-DD HH:MM"),
            }})
            .value()
            ;
    }

    showCreateDialog() {
        this.setState( {showCreateInvtDialog: true});
    }

    onRowClick(id, deposit) {
        const selectedMchds = _.find(this.state.personalInventories, invt => invt.id === id);
        this.setState({
            deposit: deposit,
            showUpdateInvtDialog: true,
            selectedMerchandise: selectedMchds,
        });
    }

    getColumns() {
        return [
            {
                type: "text",
                title: "编号",
                selector: "id",
            },
            {
                type: "text",
                title: "品牌",
                selector: "brand",
            }, {
                type: "text",
                title: "品类",
                selector: "category",
                width: 200,
            }, {
                type: "text",
                title: "商品编码",
                selector: "code",
            }, {
                type: "text",
                title: "数量",
                selector: "quantity",
                width: 50,
            }, {
                type: "text",
                title: "价格",
                selector: "price",
            }, {
                title: "型号",
                selector: "model",
                type: "text"
            }, {
                title: "认证",
                selector: "certification",
                type: "text"
            }, {
                title: "售后服务",
                type: "action",
                selector: "after_sales",
                renderContent: (row) => (`${row.value} 年`)
            }, {
                title: "供货信息",
                selector: "info",
                width: 150,
                type: "text"
            }, {
                title: "属性",
                selector: "spare_parts",
                type: "text"
            }, {
                type: "text",
                title: "修改时间",
                selector: "modifiedDate",
                width: 100,
            }, {
                type: "action",
                title: "操作",
                renderContent: (row) =>
                    (<>
                        <button onClick={() => {this.onRowClick(row.original.id, true)}} className="row-action">+</button>
                        <button onClick={() => {this.onRowClick(row.original.id, false)}} className="row-action">-</button></>)
            }

        ];
        }

    onInventoryCreate(result) {
        this.setState({
            showCreateInvtDialog: false,
            showUpdateInvtResult: true,
            ...result,
        });

        this.getPersonalInventories();
    }

    onSaveInventry(result) {
        this.setState({
            showUpdateInvtDialog: false,
            showUpdateInvtResult: true,
            ...result,
        });

        this.getPersonalInventories();
    }

    onFetchData(state) {
        const url = `${this.state.url}&page_size=${state.pageSize}&page=${state.page+1}`;
        $.get(url, (data) => {
            const inventories = PersonalDataTable.buildPersonalInventoryTable(data.results);
            this.setState({
                next: data.next,
                previous: data.previous,
                personalInventories: inventories,
                options: [],
                pages: Math.ceil(data.count / state.pageSize),
                pageSize: state.pageSize,
            });
        });
    }

    render() {
        return (<div id="personal">
            <button className="btn btn-default create-inventory" onClick={this.showCreateDialog}>新建库存</button>
            <InventoryTable className="table"
                            data={this.state.personalInventories}
                            columns={this.getColumns()}
                            pages={this.state.pages}
                            pageSize={this.state.pageSize}
                            showPagination={true}
                            onFetchData={this.onFetchData}
                            manual={true}
            />
            {this.state.showUpdateInvtResult && <Alert variant={this.state.messageType} closeLabel="close">{this.state.message}</Alert>}

            <PersonalInventoryCreateDialog show={this.state.showCreateInvtDialog}
                                           closeDialog={() => {this.setState( { showCreateInvtDialog: false});}}
                                           currentUser={this.props.currentUser}
                                           onInventoryCreate={this.onInventoryCreate}/>

            <PersonalInventoryUpdateDialog deposit={this.state.deposit}
                                           show={this.state.showUpdateInvtDialog}
                                           closeDialog={() => this.setState({showUpdateInvtDialog: false})}
                                           onSaveInventry={this.onSaveInventry}
                                           selectedMerchandise={this.state.selectedMerchandise}
                                           currentUser={this.props.currentUser}/>
        </div>);
    }
}
