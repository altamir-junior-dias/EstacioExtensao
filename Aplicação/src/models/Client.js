export class Client {
  constructor(data) {
    this.id = data.id;
    this.client_id = data.client_id;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.extraction_date = data.extraction_date;
    this.last_sync = data.last_sync;
  }

  get displayPhone() {
    if (!this.phone) return 'Não informado';
    
    const phone = this.phone.replace(/\D/g, '');
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return this.phone;
  }

  get displayEmail() {
    return this.email || 'Não informado';
  }
}