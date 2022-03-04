/* eslint-disable max-len */
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild(IonContent) content: IonContent;
  dark = false;
  form: FormGroup;
  networks: number[] = [1, 2];
  output: { networkId: string; broadcast: string; mask: string }[] = [];

  binaryValues = [
    1, 2, 4, 8, 16, 32, 64, 128,  // 0-7
    1, 2, 4, 8, 16, 32, 64, 128,  // 8-15
    1, 2, 4, 8, 16, 32, 64, 128];  // 16-23
  // form: FormGroup;

  constructor() {
    const savedTheme = localStorage.getItem('dark');
    if (savedTheme !== undefined && savedTheme !== null) {
      this.dark = JSON.parse(savedTheme);
    } else {
      localStorage.setItem('dark', this.dark ? 'true' : 'false');
    }
    this.themeToggle(this.dark);
  }

  ngOnInit() {
    this.form = new FormGroup({
      ipAddress: new FormControl(null, [Validators.required, Validators.maxLength(15), Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]),
      mask: new FormControl(null, [Validators.required, Validators.min(8), Validators.max(30)]),
      sizes: new FormGroup({
        size1: new FormControl(null, [Validators.required, Validators.min(2)]),
        size2: new FormControl(null, [Validators.required, Validators.min(2)])
      })
    });
  }

  // Add or remove the "dark" class based on if the media query matches
  themeToggle(shouldAdd?: boolean) {
    document.body.classList.toggle('dark', shouldAdd);
    if (shouldAdd === undefined) {
      this.dark = !this.dark;
    }
    localStorage.setItem('dark', this.dark ? 'true' : 'false');
  }

  convertToBinary(x: number) {
    return x.toString(2);
  }

  convertToDecimal(x: string) {
    return parseInt(x, 2);
  }

  addNetwork() {
    const newNet = this.networks[this.networks.length - 1] + 1;
    this.networks.push(newNet);
    (this.form.get('sizes') as FormGroup).addControl('size' + newNet, new FormControl(null, [Validators.required, Validators.min(2)]));
  }

  removeNetwork() {
    const removedNet = this.networks.pop();
    (this.form.get('sizes') as FormGroup).removeControl('size' + removedNet);
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.output = [];
      const ipDecimal = this.form.get('ipAddress').value.split('.').map(Number);
      // const ipBinary = [];
      // for (const ip of ipDecimal) {
      //   ipBinary.push(this.convertToBinary(ip));
      // }
      //
      // const maskDecimal = form.value.mask;
      // let maskBinary: any = '00000000000000000000000000000000';
      // for (let i = 0; i < 32; i++) {
      //   if (i < maskDecimal) {
      //     maskBinary = maskBinary.substring(0, i) + '1' + maskBinary.substring(i + 1);
      //   }
      // }
      // maskBinary = maskBinary.match(/.{1,8}/g);

      const sizes: number[] = [];

      for (const size of Object.values<number>(this.form.value.sizes)) {
        sizes.push(size);
      }
      sizes.sort((a, b) => b - a);

      for (const size of sizes) {
        if (!size) {
          continue;
        }
        // console.log('Size is ' + size);
        // console.log('Binary value is ' + this.convertToBinary(size));
        // console.log('We need to reserve ' + this.convertToBinary(size).length + ' bits');
        // console.log('Mask is ' + (32 - this.convertToBinary(size).length));
        // console.log('Increment is ' + this.binaryValues[this.convertToBinary(size).length]);

        if (this.convertToBinary(size).length >= 0 && this.convertToBinary(size).length <= 7) { // On the fourth octet
          this.output.push({
            networkId: ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3],
            broadcast: ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + (ipDecimal[3] + this.binaryValues[this.convertToBinary(size).length] - 1),
            mask: '/' + (32 - this.convertToBinary(size).length)
          });
          // console.log(
          //   ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3] + ' ==> ' +
          //   ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + (ipDecimal[3] + this.binaryValues[this.convertToBinary(size).length] - 1) + '/' + (32 - this.convertToBinary(size).length));

          ipDecimal[3] += this.binaryValues[this.convertToBinary(size).length];
        } else if (this.convertToBinary(size).length >= 8 && this.convertToBinary(size).length <= 15) { // On the third octet
          this.output.push({
            networkId: ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3],
            broadcast: ipDecimal[0] + '.' + ipDecimal[1] + '.' + (ipDecimal[2] + this.binaryValues[this.convertToBinary(size).length] - 1) + '.' + (ipDecimal[3] === 0 ? 255 : ipDecimal[3]),
            mask: '/' + (32 - this.convertToBinary(size).length)
          });
            // console.log(
            //   ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3] + ' ==> ' +
            //   ipDecimal[0] + '.' + ipDecimal[1] + '.' + (ipDecimal[2] + this.binaryValues[this.convertToBinary(size).length] - 1) + '.' + (ipDecimal[3] === 0 ? 255 : ipDecimal[3]) + '/' + (32 - this.convertToBinary(size).length));

            ipDecimal[2] += this.binaryValues[this.convertToBinary(size).length];
        } else if (this.convertToBinary(size).length >= 16 && this.convertToBinary(size).length <= 23) { // On the second octet
          this.output.push({
            networkId: ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3],
            broadcast: ipDecimal[0] + '.' + (ipDecimal[1] + this.binaryValues[this.convertToBinary(size).length] - 1) + '.' + (ipDecimal[2] === 0 ? 255 : ipDecimal[2]) + '.' + (ipDecimal[3] === 0 ? 255 : ipDecimal[3]),
            mask: '/' + (32 - this.convertToBinary(size).length)
          });
              // console.log(
              //   ipDecimal[0] + '.' + ipDecimal[1] + '.' + ipDecimal[2] + '.' + ipDecimal[3] + ' ==> ' +
              //   ipDecimal[0] + '.' + (ipDecimal[1] + this.binaryValues[this.convertToBinary(size).length] - 1) + '.' + (ipDecimal[2] === 0 ? 255 : ipDecimal[2]) + '.' + (ipDecimal[3] === 0 ? 255 : ipDecimal[3]) + '/' + (32 - this.convertToBinary(size).length));

              ipDecimal[1] += this.binaryValues[this.convertToBinary(size).length];
            }
        for (let i = 3; i >= 0; i--) {
          if (ipDecimal[i] > 255) {
            ipDecimal[i] = 0;
            ipDecimal[i - 1] += 1;
          }
        }
        // console.log('\n');
      }
      this.content.scrollToBottom(1500);
    }
  }
}
