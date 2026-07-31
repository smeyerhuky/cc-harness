#!/usr/bin/env python3
"""Gauss linking number between two ring centrelines. |Lk|~1 => truly interlinked,
~0 => not linked (may still be collision-free but separable)."""
import numpy as np, math, sys

def ring_centreline(R, tilt_deg, center, n=240):
    t=math.radians(tilt_deg); ct,st=math.cos(t),math.sin(t)
    phi=np.linspace(0,2*math.pi,n,endpoint=False)
    x=R*np.cos(phi); y=R*np.sin(phi); z=np.zeros_like(phi)
    # rotate about Y by tilt: (x,z)->(x*ct+z*st, -x*st+z*ct)
    xr=x*ct+z*st; zr=-x*st+z*ct
    pts=np.stack([xr+center[0], y+center[1], zr+center[2]],1)
    return pts

def linking_number(c1,c2):
    # discrete Gauss integral over segment midpoints
    n1=len(c1); n2=len(c2)
    r1=c1; r1n=np.roll(c1,-1,0); dr1=r1n-r1; m1=(r1+r1n)/2
    r2=c2; r2n=np.roll(c2,-1,0); dr2=r2n-r2; m2=(r2+r2n)/2
    Lk=0.0
    for i in range(n1):
        diff=m1[i]-m2                     # (n2,3)
        cross=np.cross(np.tile(dr1[i],(n2,1)),dr2)
        num=np.einsum('ij,ij->i',diff,cross)
        den=np.linalg.norm(diff,axis=1)**3+1e-12
        Lk+=np.sum(num/den)
    return Lk/(4*math.pi)

if __name__=="__main__":
    R=(8.0+1.6)/2
    # A: tiltA at (0,0,liftA) ; B: tiltB at (dx,dy,liftB)
    tA,tB,dx,dy=[float(x) for x in sys.argv[1:5]]
    liftA=R*abs(math.sin(math.radians(tA)))+0.8
    liftB=R*abs(math.sin(math.radians(tB)))+0.8
    a=ring_centreline(R,tA,(0,0,liftA)); b=ring_centreline(R,tB,(dx,dy,liftB))
    print(f"Lk = {linking_number(a,b):+.3f}")
