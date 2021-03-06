import { Injectable } from '@angular/core';
import { SocketService } from './../services/socket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
interface accountForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}
interface contactForm {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: number;
    phone: number;
}
interface fundingForm {
    accountType: string;
    accountNumber: number;
    routingNumber: number;
}
interface Payout {
    date: string;
    amount: string;
}
interface AccountData {
    account_number: string;
    balance: string;
    payouts: Array<Payout>;
    // [{ date: { type: Date }, amount: { type: String } }]
}
interface Transfer {
    date: string;
    amount: string;
}
interface FundingData {
    accountType: string;
    accountNumber: string;
    routingNumber: string;
    authorized: boolean;
    verified: boolean;
    scheduled_withdrawals: Transfer
    scheduled_deposits: Transfer
}
@Injectable()
export class DataService {
    private _accountForm: accountForm;
    public _contactForm: contactForm;
    public _fundingForm: fundingForm;
    private accountData: AccountData;
    private fundingData: FundingData;
    private _account$: BehaviorSubject<any>;
    private _funding$: BehaviorSubject<any>;
    private emailVerified: boolean = true;
    private _emailVerified$: BehaviorSubject<any>;
    constructor(private http: Http, public io: SocketService) {
        const context = this;
        this._account$ = new BehaviorSubject(this.accountData);
        this._funding$ = new BehaviorSubject(this.fundingData);
        this._emailVerified$ = new BehaviorSubject(this.emailVerified);

        io.socket.on('accountData', function (data) { context.accountData = data; if (context._account$) context._account$.next(data); });
        io.socket.on('fundingData', function (data) { context.fundingData = data; if (context._funding$) context._funding$.next(data); });
        io.socket.on('emailVerified', function (data) { context.emailVerified = data; context._emailVerified$.next(data); });

    }

    public accountForm(form: accountForm) {
        this._accountForm = form;
        this._accountForm['confirmPassword'] = undefined;
        console.log("SUBMITTING ACCOUNT", form)
        this.io.socket.emit('accountForm', form);
    }
    public contactForm(form: contactForm) {
        this._contactForm = form;
        console.log("SUBMITTING CONTACT", form)
        this.io.socket.emit('contactForm', form, this._accountForm);
    }
    public fundingForm(form: fundingForm) {
        this._fundingForm = form;
        console.log("SUBMITTING FUNDING", form)
        // need to verify bank account, double ACH deposits
        this.io.socket.emit('fundingForm', form, this._accountForm);
    }
    public verifyEmail(pin: string) {
        if (pin)
            this.io.socket.emit('verifyEmail', pin);
    }
    public resendVerifyEmail() {
        this.io.socket.emit('resendVerifyEmail');
    }
    public verifyBank(one: string, two: string) {
        if (one && two)
            this.io.socket.emit('verifyBank', { one, two });
    }
    get account$() {
        return this._account$.asObservable();
    }
    get funding$() {
        return this._funding$.asObservable();
    }
    get emailVerified$() {
        return this._emailVerified$.asObservable();
    }
}
