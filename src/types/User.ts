export interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: Date;
  image: string;
  coverImage: string;
  bio: string;
  location: string;
  website: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  // created_lens?: Lens[];
  // tokenPage?: TokenPage[];
  // dnas?: Dna[];
  // dataSets?: DataSet[];
  // lensGoods?: LensGood[];
  // orders?: Order[];
  // couponUsages?: UserCouponUsage[];
  // lensUsages?: LensUsage[];
  // subscriptions?: Subscription[];
}
